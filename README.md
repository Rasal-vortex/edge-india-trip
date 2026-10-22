# Nadukani & Wayanad Trip Booking Website

A production-ready, mobile-first booking website for a 2-day trip to **Nadukani and Wayanad**, purpose-built for adults aged 35–40+.

- Total trip cost: **₹2,200** | Required advance: **₹1,100 (50%)**
- Trip dates: **31 Oct – 01 Nov** (configurable year)

---

## 🌟 Key Features

1. **Uncle-Friendly Mobile-First Design**:
   - Full-bleed background hero using **Misty Mountain Road at Golden Hour** with high-contrast text overlay.
   - Large, clear touch targets (54px+ tall) and bold labels.
   - Zero trendy pill tags or excessive text.
   - Crystal-clear pricing: **₹1,100 Advance (50%)** and **₹2,200 Total Trip Cost**.

2. **Simple UPI Advance Payment**:
   - Scannable UPI QR code (Google Pay, PhonePe, Paytm, BHIM).
   - UPI mobile number with 1-tap **Copy** button.
   - Clear 2-step instruction: Pay ₹1,100, then upload screenshot.

3. **Booking Form with Screenshot Proof**:
   - Traveler Full Name, Mobile (WhatsApp), and Payment Screenshot.
   - Client and server-side validation (10-digit Indian numbers starting with 6–9).
   - Duplicate submission prevention.
   - Secure server-side processing with rate limiting.

4. **Confirmation Screen**:
   - Generates human-readable reference ID (e.g. `NW-2026-M74S`).
   - Friendly confirmation message: *"Your booking request has been received! We will verify your advance payment and confirm your booking."*

5. **Protected Admin Download (`/admin`)**:
   - Password-protected with the `ADMIN_PASSWORD` environment variable.
   - View a simple bookings table and download all names, phone numbers, company names, and paid amounts as CSV or PDF.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database & Storage**: Supabase PostgreSQL + Supabase Private Storage (`booking-payments`)
- **Deployment**: Vercel ready

---

## 🚀 Quick Start (Local Development)

1. Clone or open the project directory:
   ```bash
   cd e:\Edge-Trip
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.
   - Main Booking Page: `http://localhost:3000`
   - Admin Portal: `http://localhost:3000/admin` (set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in `.env.local`)

---

## ⚙️ How to Connect Real Supabase Database & Storage

The application works out-of-the-box in local development with an automated fallback store. To connect your live Supabase project:

### Step 1: Run the Database Migration
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor**.
3. Copy and paste the contents of [`supabase/migrations/01_init_trip_booking.sql`](file:///e:/Edge-Trip/supabase/migrations/01_init_trip_booking.sql) and click **Run**.
   - This creates the `trips` and `bookings` tables, indexes, Row Level Security (RLS) policies, and the private `booking-payments` storage bucket.

### Step 2: Configure Environment Variables
In your `.env.local` file (or in Vercel project settings):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Admin Password for /admin
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_SESSION_SECRET=a-random-32-character-secret-key

# Business Details
NEXT_PUBLIC_TRIP_YEAR=2026
NEXT_PUBLIC_UPI_ID=yourname@upi
NEXT_PUBLIC_UPI_PHONE=9847012345
NEXT_PUBLIC_PAYEE_NAME=Your Business Name
```

---

## 📸 Replacing the Hero Image and UPI QR Code

- **Hero Image**:
  - The hero image is loaded from `public/images/hero.png` (which uses the provided `Misty Mountain Road at Golden Hour (1).png`).
  - To change it, replace `public/images/hero.png` or update `NEXT_PUBLIC_HERO_IMAGE` in `.env.local`.

- **UPI QR Code**:
  - Located at `public/images/sample-upi-qr.svg`.
  - When you receive your real QR code image from your bank/GPay/PhonePe business account, save it as `public/images/payment-qr.jpg` and set `NEXT_PUBLIC_QR_IMAGE=/images/payment-qr.jpg` in `.env.local`.

---

## 🧪 Testing

Run automated validation tests:
```bash
npm test
```

Build the production bundle:
```bash
npm run build
```
