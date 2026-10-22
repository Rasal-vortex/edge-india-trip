import React from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata = {
  title: 'Admin Dashboard | 2-Day Trip',
  description: 'Manage traveler bookings, verify UPI payments, and review screenshot proof.',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
