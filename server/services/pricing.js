// ============================================
// חישובי מחיר: מע"מ, משלוח, סך הכל
// ============================================
// המחירים ב-DB כבר כוללים מע"מ (סטנדרט B2C בישראל).
// אנחנו מציגים פירוק בדף ה-checkout: לפני מע"מ + מע"מ + משלוח.
// ============================================
import { config } from '../config.js';

const round2 = (n) => Math.round(n * 100) / 100;

export function calculateShipping(subtotalInVat) {
  const { shippingFlatRate, freeShippingThreshold } = config.commerce;
  if (subtotalInVat >= freeShippingThreshold) return 0;
  return shippingFlatRate;
}

// items = [{ unitPrice, quantity }] - יחידה במחיר inc-VAT
export function calculateOrderTotals(items) {
  const vatRate = config.commerce.vatRate;

  const subtotalInVat = items.reduce(
    (sum, it) => sum + Number(it.unitPrice) * Number(it.quantity),
    0
  );

  const shipping = calculateShipping(subtotalInVat);
  const totalInVat = subtotalInVat + shipping;

  // פירוק מע"מ - מבודדים אותו מתוך הסכום
  const subtotalExVat = subtotalInVat / (1 + vatRate);
  const vat = subtotalInVat - subtotalExVat;

  return {
    subtotalExVat: round2(subtotalExVat),
    vat: round2(vat),
    subtotalInVat: round2(subtotalInVat),
    shipping: round2(shipping),
    total: round2(totalInVat),
    vatRate,
  };
}
