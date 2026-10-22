-- ====================================================================
-- SUPABASE MIGRATION: Nadukani & Wayanad Trip Booking Schema
-- ====================================================================

-- 1. Create TRIPS Table
CREATE TABLE IF NOT EXISTS public.trips (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    destination TEXT NOT NULL,
    duration TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    year INTEGER NOT NULL DEFAULT 2026,
    total_amount INTEGER NOT NULL DEFAULT 2200,
    advance_amount INTEGER NOT NULL DEFAULT 1100,
    advance_percentage INTEGER NOT NULL DEFAULT 50,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed initial Nadukani & Wayanad Trip
INSERT INTO public.trips (
    id, name, destination, duration, start_date, end_date, year, total_amount, advance_amount, advance_percentage, is_active
) VALUES (
    'nadukani-wayanad-2026',
    'Nadukani & Wayanad Trip',
    'Nadukani and Wayanad',
    '2 Days',
    '31 Oct',
    '01 Nov',
    2026,
    2200,
    1100,
    50,
    true
)
ON CONFLICT (id) DO UPDATE SET
    total_amount = 2200,
    advance_amount = 1100,
    advance_percentage = 50,
    is_active = true;

-- 2. Create BOOKINGS Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT NOT NULL,
    trip_id TEXT REFERENCES public.trips(id) ON DELETE SET NULL,
    total_amount INTEGER NOT NULL DEFAULT 2200,
    advance_amount INTEGER NOT NULL DEFAULT 1100,
    payment_screenshot_path TEXT NOT NULL,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending_verification', 'verified', 'rejected')) DEFAULT 'pending_verification',
    booking_status TEXT NOT NULL CHECK (booking_status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings (booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON public.bookings (phone);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings (payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_status ON public.bookings (booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings (created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 5. Trips RLS Policies
-- Allow anyone to read active trips
CREATE POLICY "Allow public read access to active trips"
    ON public.trips
    FOR SELECT
    USING (is_active = true);

-- 6. Bookings RLS Policies
-- Prevent direct anonymous read/list to protect customer personal info and payment images
-- All insertions and queries are performed through authenticated server-side handlers using the service role key
CREATE POLICY "Deny anonymous direct read of bookings"
    ON public.bookings
    FOR SELECT
    TO anon
    USING (false);

CREATE POLICY "Allow authenticated staff to read bookings"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated staff to update bookings"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (true);

-- 7. Supabase Storage Setup (Run via SQL editor in Supabase Dashboard)
-- Create private bucket 'booking-payments'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'booking-payments',
    'booking-payments',
    false, -- MUST BE FALSE (Private)
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS: Prevent public access to private payment screenshots
CREATE POLICY "Deny public select on payment screenshots"
    ON storage.objects
    FOR SELECT
    TO anon
    USING (bucket_id != 'booking-payments');

-- Allow authenticated users / service role full access
CREATE POLICY "Allow authenticated access to payment screenshots"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (bucket_id = 'booking-payments');
