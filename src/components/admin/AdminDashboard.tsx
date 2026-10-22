'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { AlertCircle, Download, FileText, Lock, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';

interface BookingRow {
  full_name: string;
  phone: string;
  company_name: string | null;
  advance_amount: number;
}

async function makeBookingsPdf(bookings: BookingRow[]): Promise<Blob> {
  const rows = bookings.length ? bookings : [{
    full_name: 'No bookings submitted yet',
    phone: '',
    company_name: '',
    advance_amount: 0,
  }];
  const rowsPerPage = 22;
  const pages: Uint8Array[] = [];

  for (let start = 0; start < rows.length; start += rowsPerPage) {
    const pageRows = rows.slice(start, start + rowsPerPage);
    const canvas = document.createElement('canvas');
    canvas.width = 1123;
    canvas.height = 794;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not create PDF page.');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#17221b';
    context.font = 'bold 26px Arial, sans-serif';
    context.fillText('Edge India Community Trip - Bookings', 48, 55);
    context.font = 'bold 17px Arial, sans-serif';
    context.fillText('Name', 48, 100);
    context.fillText('Phone', 310, 100);
    context.fillText('Company', 470, 100);
    context.fillText('Paid Amount', 950, 100);

    context.strokeStyle = '#a8b0aa';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(48, 112);
    context.lineTo(1075, 112);
    context.stroke();
    context.font = '16px Arial, sans-serif';
    context.fillStyle = '#202820';

    pageRows.forEach((booking, index) => {
      const y = 145 + index * 28;
      context.fillText(booking.full_name, 48, y, 240);
      context.fillText(booking.phone, 310, y, 140);
      context.fillText(booking.company_name || '-', 470, y, 450);
      context.fillText(bookings.length ? `₹${booking.advance_amount.toLocaleString('en-IN')}` : '-', 950, y, 125);
      context.beginPath();
      context.moveTo(48, y + 8);
      context.lineTo(1075, y + 8);
      context.stroke();
    });

    const jpeg = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not render PDF page.')), 'image/jpeg', 0.92);
    });
    pages.push(new Uint8Array(await jpeg.arrayBuffer()));
  }

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let byteLength = 0;
  const append = (chunk: Uint8Array) => {
    chunks.push(chunk);
    byteLength += chunk.length;
  };
  const appendObject = (id: number, content: Uint8Array[]) => {
    offsets[id] = byteLength;
    append(encoder.encode(`${id} 0 obj\n`));
    content.forEach(append);
    append(encoder.encode('\nendobj\n'));
  };

  append(encoder.encode('%PDF-1.4\n'));
  appendObject(1, [encoder.encode('<< /Type /Catalog /Pages 2 0 R >>')]);
  const pageIds = pages.map((_, index) => 3 + index * 3);
  appendObject(2, [encoder.encode(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`)]);

  pages.forEach((jpeg, index) => {
    const pageId = 3 + index * 3;
    const imageId = pageId + 1;
    const contentId = pageId + 2;
    const stream = encoder.encode('q\n842 0 0 595 0 0 cm\n/Im0 Do\nQ');

    appendObject(pageId, [encoder.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`)]);
    appendObject(imageId, [
      encoder.encode(`<< /Type /XObject /Subtype /Image /Width 1123 /Height 794 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),
      jpeg,
      encoder.encode('\nendstream'),
    ]);
    appendObject(contentId, [
      encoder.encode(`<< /Length ${stream.length} >>\nstream\n`),
      stream,
      encoder.encode('\nendstream'),
    ]);
  });

  const xrefOffset = byteLength;
  let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < offsets.length; id++) {
    xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  append(encoder.encode(xref));

  const result = new Uint8Array(byteLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });
  return new Blob([result], { type: 'application/pdf' });
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth')
      .then((response) => response.json())
      .then((data) => setIsAuthenticated(Boolean(data.authenticated)))
      .catch(() => setIsAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    setIsLoadingBookings(true);
    fetch('/api/admin/bookings/export?format=json')
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load booking list.');
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setBookings(data.bookings || []);
      })
      .catch(() => {
        if (!cancelled) setDownloadError('Could not load bookings. Please refresh and try again.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBookings(false);
      });

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setLoginError(result.error || 'Invalid administrator password.');
        return;
      }

      setPassword('');
      setIsAuthenticated(true);
    } catch {
      setLoginError('Could not connect. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleDownloadCsv() {
    setIsDownloading(true);
    setDownloadError('');

    try {
      const response = await fetch('/api/admin/bookings/export?format=csv');
      if (!response.ok) {
        setDownloadError(response.status === 401
          ? 'Your admin session expired. Please log in again.'
          : 'Could not download booking data. Please try again.');
        if (response.status === 401) setIsAuthenticated(false);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'edge-india-trip-bookings.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError('Could not connect. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleDownloadPdf() {
    setIsGeneratingPdf(true);
    setDownloadError('');
    const isMobileBrowser = /android|iphone|ipad|ipod/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    // Open a tab synchronously from the button click; iOS blocks popups opened
    // after an async PDF render has completed.
    const pdfTab = isMobileBrowser ? window.open('about:blank', '_blank') : null;

    try {
      const blob = await makeBookingsPdf(bookings);
      const url = URL.createObjectURL(blob);

      if (pdfTab) {
        pdfTab.location.href = url;
        window.setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
        return;
      }

      const link = document.createElement('a');
      link.href = url;
      link.download = 'edge-india-trip-bookings.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      pdfTab?.close();
      setDownloadError('Could not create PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
  }

  if (isAuthenticated === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <RefreshCw className="h-7 w-7 animate-spin text-emerald-900" aria-label="Checking admin session" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
        <section className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex justify-center text-emerald-900">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-center text-2xl font-bold text-stone-900">Admin Login</h1>
          <p className="mb-5 mt-1 text-center text-sm text-stone-600">Enter the admin password to download trip bookings.</p>

          {loginError && (
            <p role="alert" className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0" />{loginError}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <label htmlFor="admin-password" className="sr-only">Admin password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Admin password"
              required
              className="w-full rounded-lg border border-stone-300 px-4 py-3 text-base focus:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800/20"
            />
            <button
              type="submit"
              disabled={isLoggingIn}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-3 font-bold text-white hover:bg-emerald-950 disabled:opacity-60"
            >
              {isLoggingIn && <RefreshCw className="h-4 w-4 animate-spin" />}
              {isLoggingIn ? 'Checking…' : 'Log in'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-stone-900 sm:py-12">
      <section className="mx-auto max-w-5xl rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 shrink-0 text-emerald-900" />
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">Submitted Bookings</h1>
            </div>
          </div>
          <button onClick={handleLogout} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100">
            <LogOut className="h-4 w-4" />Log out
          </button>
        </div>

        {downloadError && (
          <p role="alert" className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />{downloadError}
          </p>
        )}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleDownloadCsv}
            disabled={isDownloading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-900 px-5 py-3 font-bold text-white hover:bg-emerald-950 disabled:opacity-60"
          >
            {isDownloading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            {isDownloading ? 'Preparing CSV…' : 'Download CSV'}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || isLoadingBookings}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-900 px-5 py-3 font-bold text-emerald-900 hover:bg-emerald-50 disabled:opacity-60"
          >
            {isGeneratingPdf ? <RefreshCw className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
            {isGeneratingPdf ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>
        <p className="mb-4 text-center text-xs text-stone-500 sm:hidden">
          On phones, the PDF opens in a new tab. Use the browser’s share or download control to save it.
        </p>

        <div className="overflow-x-auto">
          {isLoadingBookings ? (
            <p className="py-8 text-center text-sm text-stone-500">Loading bookings…</p>
          ) : (
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-stone-300 bg-stone-50">
                  <th className="px-3 py-3 font-bold">Name</th>
                  <th className="px-3 py-3 font-bold">Phone</th>
                  <th className="px-3 py-3 font-bold">Company</th>
                  <th className="px-3 py-3 text-right font-bold">Paid Amount</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => (
                  <tr key={`${booking.phone}-${index}`} className="border-b border-stone-200">
                    <td className="px-3 py-3">{booking.full_name}</td>
                    <td className="whitespace-nowrap px-3 py-3">{booking.phone}</td>
                    <td className="px-3 py-3">{booking.company_name || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">₹{booking.advance_amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {bookings.length === 0 && !downloadError && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-stone-500">No bookings submitted yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
