'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Copy, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { TripConfig } from '@/lib/types';
import { formatINR } from '@/lib/config';

interface PaymentSectionProps {
  trip: TripConfig;
}

export default function PaymentSection({ trip }: PaymentSectionProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [desktopNotice, setDesktopNotice] = useState(false);

  const upiId = trip.upiId || 'iamnetworkerwdr-4@okaxis';
  const payeeName = trip.payeeName || 'IAM Networker';
  const advanceAmount = trip.advanceAmount.toString();
  const note = 'Trip Advance';

  // Check if user is on mobile
  useEffect(() => {
    const userAgent = navigator?.userAgent || '';
    const mobileCheck = /android|iphone|ipad|ipod|mobile/i.test(userAgent);
    setIsMobile(mobileCheck);
  }, []);

  const copyToClipboard = (text: string, fieldName: string) => {
    // Try modern Clipboard API first (requires HTTPS / secure context)
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2500);
      }).catch(() => {
        // Clipboard API failed — fall back to execCommand
        legacyCopy(text, fieldName);
      });
    } else {
      // Fallback for HTTP, old browsers, or restricted environments
      legacyCopy(text, fieldName);
    }
  };

  const legacyCopy = (text: string, fieldName: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (success) {
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2500);
      }
    } catch {
      // copy not supported
    }
  };

  // Standard encoded parameters
  const upiParams = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: advanceAmount,
    cu: 'INR',
    tn: note,
  });

  const standardUpiUri = `upi://pay?${upiParams.toString().replace(/\+/g, '%20')}`;

  // Direct Android Intent targeting WhatsApp Pay
  const whatsappAndroidIntent = `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${advanceAmount}&cu=INR&tn=${encodeURIComponent(
    note
  )}#Intent;scheme=upi;package=com.whatsapp;end`;

  // Determine best URI: WhatsApp direct intent or standard UPI
  const targetUpiUri =
    typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)
      ? whatsappAndroidIntent
      : standardUpiUri;

  const handleDesktopPayClick = (e: React.MouseEvent) => {
    if (isMobile === false) {
      e.preventDefault();
      copyToClipboard(upiId, 'upiId');
      setDesktopNotice(true);
      return;
    }
  };

  return (
    <div id="trip-payment" className="w-full my-6 scroll-mt-6 bg-white rounded-2xl border-2 border-stone-300 p-5 sm:p-7 shadow-sm">
      
      {/* Title */}
      <div className="border-b border-stone-200 pb-4 mb-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
          Trip Payment
        </h2>
        <p className="text-base text-stone-700 mt-1">
          Total amount is <strong>₹2,200</strong>. You should pay a minimum of <strong>50%</strong> (₹1,100) or more of the trip amount.
        </p>
      </div>

      {/* QR Code & Direct UPI Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        
        {/* QR Code */}
        <div className="flex flex-col items-center text-center p-4 bg-stone-50 border border-stone-200 rounded-xl">
          <p className="font-bold text-stone-800 text-base mb-2">
            Scan QR Code in Any UPI App
          </p>
          <div className="w-64 h-64 sm:w-72 sm:h-72 relative bg-white p-3 border-2 border-stone-800 rounded-2xl shadow-sm flex items-center justify-center">
            <Image
              src="/qr-code.png"
              alt="Scan UPI QR code in WhatsApp, Google Pay, or PhonePe"
              width={280}
              height={280}
              className="object-contain w-full h-full rounded-lg"
              priority
              unoptimized
            />
          </div>
          <p className="text-xs text-stone-600 mt-2 font-medium">
            WhatsApp Pay • Google Pay • PhonePe • Paytm
          </p>
        </div>

        {/* UPI Details & WhatsApp Pay Button */}
        <div className="space-y-4">
          
          {/* UPI ID Box with Copy */}
          <div className="bg-stone-50 border-2 border-stone-300 p-4 rounded-xl">
            <p className="text-xs font-bold text-stone-600 uppercase">
              UPI ID
            </p>
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="font-mono text-base sm:text-lg font-black text-stone-900 break-all select-all">
                {upiId}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(upiId, 'upiId')}
                className="px-3.5 py-2 bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-800 font-bold text-sm rounded-lg flex items-center gap-1.5 cursor-pointer touch-target-btn flex-shrink-0"
                aria-label="Copy UPI ID"
              >
                {copiedField === 'upiId' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span className="text-emerald-800 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* UPI Mobile Number Box with Copy */}
          <div className="bg-stone-50 border-2 border-stone-300 p-4 rounded-xl">
            <p className="text-xs font-bold text-stone-600 uppercase">
              UPI Mobile Number
            </p>
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-stone-900 tracking-wide select-all">
                +91 {trip.upiPhoneNumber}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(trip.upiPhoneNumber, 'phone')}
                className="px-3.5 py-2 bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-800 font-bold text-sm rounded-lg flex items-center gap-1.5 cursor-pointer touch-target-btn flex-shrink-0"
                aria-label="Copy UPI Phone number"
              >
                {copiedField === 'phone' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span className="text-emerald-800 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Single Direct WhatsApp Pay Button */}
          <div className="pt-1">
            <a
              href={targetUpiUri}
              onClick={handleDesktopPayClick}
              className="w-full inline-flex items-center justify-center gap-3 py-4 px-6 bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1caa52] text-white font-black text-lg sm:text-xl rounded-xl shadow-md active:scale-[0.99] transition-all cursor-pointer min-h-[54px] touch-target-btn text-center"
              aria-label="Pay with WhatsApp Pay"
            >
              {/* WhatsApp Icon */}
              <svg className="w-6 h-6 flex-shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.02 16.57c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a7.99 7.99 0 0 1-1.23-4.29c0-4.41 3.59-8 8.01-8 2.14 0 4.15.84 5.67 2.35 1.52 1.52 2.35 3.53 2.35 5.67 0 4.41-3.6 8.02-8.01 8.02zm4.39-6c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.19-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42l-.46-.01c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/>
              </svg>
              <span>Pay with WhatsApp Pay</span>
              <ArrowRight className="w-5 h-5 text-white/90 flex-shrink-0" />
            </a>

           

            {/* Desktop Notice when tapped on PC */}
            {desktopNotice && (
              <div className="mt-3 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs sm:text-sm text-amber-950 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900 text-sm">
                    WhatsApp Pay opens directly on mobile phones
                  </p>
                  <p className="mt-1 text-amber-800">
                    We have copied the UPI ID (<strong>{upiId}</strong>) to your clipboard!
                  </p>
                  <p className="mt-0.5 text-stone-700">
                    On your computer, scan the QR code with WhatsApp or your phone camera to complete payment.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
