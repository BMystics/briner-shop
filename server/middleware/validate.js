// ============================================
// helpers לולידציה של בקשות API
// ============================================
// משתמשים ב-throw של ValidationError, ו-errorHandler ב-index.js יתפוס.
// ============================================

export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.status = 400;
    this.field = field;
  }
}

export function assert(condition, message, field) {
  if (!condition) throw new ValidationError(message, field);
}

export function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// טלפון ישראלי: 050-1234567 / 0501234567 / +972501234567
export function isIsraeliPhone(value) {
  if (typeof value !== 'string') return false;
  const digits = value.replace(/[\s\-+()]/g, '');
  // אחרי ניקוי: 9 ספרות מתחילות ב-9725 או 10 ספרות מתחילות ב-05
  return /^(972|0)(5\d)\d{7}$/.test(digits);
}

export function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
