'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Loader2,
} from 'lucide-react';
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  validateBookingForm,
  ValidationErrors,
} from '@/lib/validation/booking';
import { formatINR } from '@/lib/config';

export default function BookingForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [paidAmount, setPaidAmount] = useState('1100');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        screenshot: 'Please select a photo (JPG, PNG, or WebP).',
      }));
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrors((prev) => ({
        ...prev,
        screenshot: 'File size is too large (max 5MB). Please choose a smaller photo.',
      }));
      return;
    }

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.screenshot;
      return copy;
    });

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setGeneralError(null);

    const validation = validateBookingForm({
      fullName,
      phone,
      companyName,
      paidAmount,
      file: selectedFile,
      hasFileSelected: !!selectedFile,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      showToast('⚠️ Please fill in all required fields before submitting.');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('companyName', companyName.trim());
      formData.append('phone', validation.normalizedPhone || phone.trim());
      formData.append('paidAmount', paidAmount.trim());
      if (selectedFile) {
        formData.append('screenshot', selectedFile);
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        }
        setGeneralError(
          result.error || 'Could not submit booking. Please try again.'
        );
        setIsSubmitting(false);
        return;
      }

      // Next.js may keep this client component mounted in its route cache. Clear
      // the form before navigating so returning from the success page never
      // restores submitted values or a permanently disabled submit button.
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFullName('');
      setCompanyName('');
      setPhone('');
      setPaidAmount('1100');
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setErrors({});
      setIsSubmitting(false);

      // The success page does not need personal details in its URL.
      router.push('/booking-success');
    } catch {
      setGeneralError('Network error. Please check your internet connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Centered Toast Notification */}
      <div
        aria-live="assertive"
        className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
          toast ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {toast && (
          <div className="pointer-events-auto flex items-center gap-3 bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-2xl text-base font-semibold max-w-xs mx-4 text-center animate-bounce-in">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{toast}</span>
          </div>
        )}
      </div>

    <section id="booking-section" className="w-full my-6 scroll-mt-6" aria-labelledby="form-heading">
      <div className="bg-white rounded-2xl border-2 border-stone-300 p-5 sm:p-7 shadow-sm">
        
        {/* Form Title - Simple and direct */}
        <h2 id="form-heading" className="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-1">
          Confirm Your Booking Details
        </h2>
       

        {/* Global Error Banner */}
        {generalError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-300 flex items-start gap-3 text-red-900">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-base">Please note:</p>
              <p className="text-sm mt-0.5">{generalError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          
          {/* Field 1: Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-lg font-bold text-stone-900 mb-1">
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) {
                  setErrors((prev) => ({ ...prev, fullName: undefined }));
                }
              }}
              disabled={isSubmitting}
              placeholder="e.g. Arshad Arif"
              autoComplete="name"
              className={`w-full px-4 py-3.5 text-lg text-stone-900 bg-stone-50 border-2 ${
                errors.fullName ? 'border-red-500 bg-red-50' : 'border-stone-300 focus:border-emerald-800'
              } rounded-xl touch-target-input`}
              aria-required="true"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm font-bold text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Field 2: Mobile Number */}
          <div>
            <label htmlFor="phone" className="block text-lg font-bold text-stone-900 mb-1">
              Mobile Number (WhatsApp) <span className="text-red-600">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                // Strip non-numeric characters and enforce 10-digit limit
                const numeric = e.target.value.replace(/\D/g, '').slice(0, 10);
                setPhone(numeric);
                if (errors.phone) {
                  setErrors((prev) => ({ ...prev, phone: undefined }));
                }
              }}
              disabled={isSubmitting}
              placeholder="Enter your 10-digit mobile number"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              className={`w-full px-4 py-3.5 text-lg font-mono text-stone-900 bg-stone-50 border-2 ${
                errors.phone ? 'border-red-500 bg-red-50' : 'border-stone-300 focus:border-emerald-800'
              } rounded-xl touch-target-input`}
              aria-required="true"
            />
            {errors.phone ? (
              <p className="mt-1 text-sm font-bold text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.phone}
              </p>
            ) : (
              <p className="mt-1 text-xs text-stone-600">
              </p>
            )}
          </div>

          {/* Field: Paid Amount */}
         

          {/* Field 3: Company Name / Place (Required) */}
          <div>
            <label htmlFor="companyName" className="block text-lg font-bold text-stone-900 mb-1">
              Company/Organization Name <span className="text-red-600">*</span>
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (errors.companyName) {
                  setErrors((prev) => ({ ...prev, companyName: undefined }));
                }
              }}
              disabled={isSubmitting}
              placeholder="e.g. Vortex"
              className={`w-full px-4 py-3.5 text-lg text-stone-900 bg-stone-50 border-2 ${
                errors.companyName ? 'border-red-500 bg-red-50' : 'border-stone-300 focus:border-emerald-800'
              } rounded-xl touch-target-input`}
              aria-required="true"
            />
            {errors.companyName && (
              <p className="mt-1 text-sm font-bold text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.companyName}
              </p>
            )}
          </div>

 <div>
            <label htmlFor="paidAmount" className="block text-lg font-bold text-stone-900 mb-1">
              Paid Amount (₹) <span className="text-red-600">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-4 rounded-l-xl border-2 border-r-0 border-stone-300 bg-stone-200 text-stone-800 font-bold text-lg select-none">
                ₹
              </span>
              <input
                id="paidAmount"
                name="paidAmount"
                type="number"
                min="1"
                step="50"
                value={paidAmount}
                onChange={(e) => {
                  setPaidAmount(e.target.value);
                  if (errors.paidAmount) {
                    setErrors((prev) => ({ ...prev, paidAmount: undefined }));
                  }
                }}
                disabled={isSubmitting}
                placeholder="e.g. 1100, 1500, 2200"
                className={`w-full px-4 py-3.5 text-lg font-mono text-stone-900 bg-stone-50 border-2 ${
                  errors.paidAmount ? 'border-red-500 bg-red-50' : 'border-stone-300 focus:border-emerald-800'
                } rounded-r-xl touch-target-input`}
                aria-required="true"
              />
            </div>
            {errors.paidAmount ? (
              <p className="mt-1 text-sm font-bold text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.paidAmount}
              </p>
            ) : (
              <p className="mt-1 text-xs text-stone-600">
              </p>
            )}
          </div>
          {/* Field 4: Payment Screenshot */}
          <div>
            <label className="block text-lg font-bold text-stone-900 mb-1">
              Attach Payment Screenshot <span className="text-red-600">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              id="screenshot"
              name="screenshot"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileChange}
              disabled={isSubmitting}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                tabIndex={0}
                role="button"
                aria-label="Tap to select payment screenshot"
                className={`w-full p-6 rounded-2xl border-2 border-dashed ${
                  errors.screenshot
                    ? 'border-red-500 bg-red-50'
                    : 'border-emerald-800 bg-emerald-50/50 hover:bg-emerald-50'
                } transition-all cursor-pointer text-center flex flex-col items-center justify-center min-h-[140px] touch-target-input`}
              >
                <UploadCloud className="w-10 h-10 text-emerald-800 mb-2" />
                <p className="text-lg font-extrabold text-stone-900">
                  Tap Here to Select Screenshot
                </p>
                <p className="text-xs text-stone-600 mt-0.5">
                  Choose photo from your phone gallery
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border-2 border-emerald-800 bg-white flex items-center gap-4">
                {previewUrl && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-stone-300 flex-shrink-0">
                    <Image
                      src={previewUrl}
                      alt="Payment screenshot preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Photo Attached</span>
                  </div>
                  <p className="text-sm font-semibold text-stone-900 truncate">
                    {selectedFile.name}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <RotateCw className="w-3 h-3" />
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            {errors.screenshot && (
              <p className="mt-1 text-sm font-bold text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.screenshot}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-6 rounded-xl font-black text-xl text-white shadow-lg transition-all flex items-center justify-center gap-2 touch-target-btn cursor-pointer ${
                isSubmitting
                  ? 'bg-stone-400 cursor-not-allowed'
                  : 'bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Booking</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </section>
    </>
  );
}
