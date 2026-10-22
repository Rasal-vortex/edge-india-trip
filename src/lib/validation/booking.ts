export interface ValidationErrors {
  fullName?: string;
  phone?: string;
  paidAmount?: string;
  companyName?: string;
  screenshot?: string;
  general?: string;
}

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Normalizes Indian phone number to 10 digits
 * Returns null if invalid
 */
export function normalizeIndianPhone(input: string): string | null {
  if (!input) return null;
  // Remove spaces, hyphens, parentheses
  let cleaned = input.trim().replace(/[\s\-\(\)]/g, '');
  
  // Remove leading +91 or 91 if length is 12
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Check if exactly 10 digits starting with 6, 7, 8, or 9
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (indianMobileRegex.test(cleaned)) {
    return cleaned;
  }
  return null;
}

export function validateBookingForm(data: {
  fullName: string;
  phone: string;
  companyName?: string;
  paidAmount?: string | number;
  file?: File | null;
  hasFileSelected?: boolean;
}): { isValid: boolean; errors: ValidationErrors; normalizedPhone?: string; parsedAmount?: number } {
  const errors: ValidationErrors = {};

  // 1. Full Name - Required
  const trimmedName = data.fullName ? data.fullName.trim() : '';
  if (!trimmedName) {
    errors.fullName = 'You missed to add this field';
  } else if (trimmedName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  } else if (trimmedName.length > 80) {
    errors.fullName = 'Full name must not exceed 80 characters.';
  }

  // 2. Mobile Phone - Required
  const trimmedPhone = data.phone ? data.phone.trim() : '';
  if (!trimmedPhone) {
    errors.phone = 'You missed to add this field';
  } else {
    const normalized = normalizeIndianPhone(trimmedPhone);
    if (!normalized) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number.';
    }
  }

  // 3. Paid Amount - Required
  if (data.paidAmount === undefined || data.paidAmount === null || data.paidAmount.toString().trim() === '') {
    errors.paidAmount = 'You missed to add this field';
  } else {
    const num = typeof data.paidAmount === 'number' ? data.paidAmount : parseInt(data.paidAmount.toString().replace(/[^\d]/g, ''), 10);
    if (isNaN(num) || num <= 0) {
      errors.paidAmount = 'Please enter a valid paid amount.';
    }
  }

  // 4. Company Name / Place - Required
  const trimmedCompany = data.companyName ? data.companyName.trim() : '';
  if (!trimmedCompany) {
    errors.companyName = 'You missed to add this field';
  }

  // 5. Payment Screenshot - Required
  if (data.file) {
    if (!ALLOWED_MIME_TYPES.includes(data.file.type)) {
      errors.screenshot = 'Please upload an image in JPEG, PNG, or WebP format.';
    } else if (data.file.size > MAX_FILE_SIZE_BYTES) {
      errors.screenshot = 'File size must be under 5 MB. Please select a smaller photo.';
    }
  } else if (!data.hasFileSelected) {
    errors.screenshot = 'You missed to add this field';
  }

  const normalizedPhone = trimmedPhone ? normalizeIndianPhone(trimmedPhone) : null;
  let parsedAmount: number | undefined = undefined;
  if (data.paidAmount) {
    const num = typeof data.paidAmount === 'number' ? data.paidAmount : parseInt(data.paidAmount.toString().replace(/[^\d]/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      parsedAmount = num;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalizedPhone: normalizedPhone || undefined,
    parsedAmount,
  };
}
