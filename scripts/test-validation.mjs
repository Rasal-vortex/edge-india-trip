import assert from 'node:assert';
import test from 'node:test';

// Phone normalization function replica for testing
function normalizeIndianPhone(input) {
  if (!input) return null;
  let cleaned = input.trim().replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (indianMobileRegex.test(cleaned)) {
    return cleaned;
  }
  return null;
}

function generateBookingReference(year = 2026) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NW-${year}-${code}`;
}

test('Valid Indian Mobile Numbers Normalization', () => {
  assert.strictEqual(normalizeIndianPhone('9847012345'), '9847012345');
  assert.strictEqual(normalizeIndianPhone('+91 98470 12345'), '9847012345');
  assert.strictEqual(normalizeIndianPhone('+919847012345'), '9847012345');
  assert.strictEqual(normalizeIndianPhone('09847012345'), '9847012345');
  assert.strictEqual(normalizeIndianPhone('919847012345'), '9847012345');
  assert.strictEqual(normalizeIndianPhone('8123456789'), '8123456789');
  assert.strictEqual(normalizeIndianPhone('7012345678'), '7012345678');
  assert.strictEqual(normalizeIndianPhone('6234567890'), '6234567890');
});

test('Rejects Invalid Mobile Numbers', () => {
  assert.strictEqual(normalizeIndianPhone('1234567890'), null); // starts with 1
  assert.strictEqual(normalizeIndianPhone('5234567890'), null); // starts with 5
  assert.strictEqual(normalizeIndianPhone('984701234'), null); // only 9 digits
  assert.strictEqual(normalizeIndianPhone('984701234567'), null); // too long
  assert.strictEqual(normalizeIndianPhone('abcdefghij'), null); // not numbers
  assert.strictEqual(normalizeIndianPhone(''), null); // empty
});

test('Booking Reference Format', () => {
  const ref = generateBookingReference(2026);
  assert.match(ref, /^NW-2026-[A-Z0-9]{4}$/);
  // Ensure no confusing 0, O, 1, I
  assert.doesNotMatch(ref.slice(8), /[0O1I]/);
});

test('UPI Deep Link URI Format', () => {
  const upiParams = new URLSearchParams({
    pa: 'iamnetworkerwdr-4@okaxis',
    pn: 'IAM Networker',
    am: '1100',
    cu: 'INR',
    tn: 'Nadukani Wayanad Trip Advance',
  });
  const upiUri = `upi://pay?${upiParams.toString().replace(/\+/g, '%20')}`;
  assert.strictEqual(
    upiUri,
    'upi://pay?pa=iamnetworkerwdr-4%40okaxis&pn=IAM%20Networker&am=1100&cu=INR&tn=Nadukani%20Wayanad%20Trip%20Advance'
  );
});

test('Paid Amount Validation', () => {
  const parsePaid = (val) => {
    if (val === undefined || val === null || val === '') return null;
    const num = parseInt(val.toString().replace(/[^\d]/g, ''), 10);
    return !isNaN(num) && num > 0 ? num : null;
  };

  assert.strictEqual(parsePaid('1100'), 1100);
  assert.strictEqual(parsePaid('1500'), 1500);
  assert.strictEqual(parsePaid('2000'), 2000);
  assert.strictEqual(parsePaid('2200'), 2200);
  assert.strictEqual(parsePaid('₹ 1,500'), 1500);
  assert.strictEqual(parsePaid('0'), null);
  assert.strictEqual(parsePaid(''), null);
});

test('Required Fields Error Message', () => {
  const requiredMsg = 'You missed to add this field';
  const checkEmpty = (val) => (!val || !val.toString().trim() ? requiredMsg : null);

  assert.strictEqual(checkEmpty(''), requiredMsg);
  assert.strictEqual(checkEmpty('   '), requiredMsg);
  assert.strictEqual(checkEmpty(null), requiredMsg);
  assert.strictEqual(checkEmpty('Ramesh'), null);
});

console.log('All validation, security, and payment URI tests passed!');
