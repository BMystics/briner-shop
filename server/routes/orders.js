// ============================================
// API נתיבים להזמנות
// POST /api/orders             - יוצר הזמנה חדשה
// GET  /api/orders/:orderNumber - מחזיר פרטי הזמנה (לדף תודה)
// ============================================
import express from 'express';
import { assert, isEmail, isIsraeliPhone, nonEmptyString, ValidationError }
  from '../middleware/validate.js';
import { calculateOrderTotals } from '../services/pricing.js';
import { createOrder, getOrderByNumber, updateOrderStatus, fetchProductsByHandles }
  from '../services/order-store.js';
import { createPaymentPage } from '../services/payplus.js';
import { config } from '../config.js';

const router = express.Router();

// -------- POST /api/orders --------
router.post('/', async (req, res, next) => {
  try {
    const { customer = {}, shippingAddress = {}, items = [], notes } = req.body || {};

    // -------- ולידציה --------
    assert(nonEmptyString(customer.name), 'שם מלא חובה', 'customer.name');
    assert(isEmail(customer.email), 'כתובת אימייל לא חוקית', 'customer.email');
    assert(isIsraeliPhone(customer.phone), 'מספר טלפון ישראלי לא חוקי', 'customer.phone');
    assert(nonEmptyString(shippingAddress.street), 'רחוב חובה', 'shippingAddress.street');
    assert(nonEmptyString(shippingAddress.city), 'עיר חובה', 'shippingAddress.city');
    assert(Array.isArray(items) && items.length > 0, 'הסל ריק', 'items');

    for (const [idx, it] of items.entries()) {
      assert(nonEmptyString(it?.handle), `פריט #${idx + 1}: handle חסר`, `items[${idx}].handle`);
      const q = Number(it?.quantity);
      assert(Number.isInteger(q) && q > 0 && q <= 99,
        `פריט #${idx + 1}: כמות חייבת להיות מספר שלם בין 1 ל-99`, `items[${idx}].quantity`);
    }

    // -------- שליפת מוצרים מ-DB (אסור לסמוך על מחיר מהלקוח) --------
    const handles = [...new Set(items.map(it => it.handle))];
    const products = await fetchProductsByHandles(handles);
    const byHandle = new Map(products.map(p => [p.handle, p]));

    const lineItems = items.map((it, idx) => {
      const product = byHandle.get(it.handle);
      assert(product, `מוצר לא נמצא: ${it.handle}`, `items[${idx}].handle`);
      // בדיקת מלאי - 0 = ללא מלאי (out of stock)
      assert(product.stock === undefined || product.stock === null || product.stock >= Number(it.quantity),
        `אין מספיק מלאי עבור "${product.name}" (נותרו ${product.stock})`,
        `items[${idx}].quantity`);
      return { product, quantity: Number(it.quantity) };
    });

    // -------- חישוב סכומים --------
    const totals = calculateOrderTotals(
      lineItems.map(li => ({ unitPrice: li.product.price, quantity: li.quantity }))
    );

    // -------- יצירת הזמנה --------
    const { order, items: savedItems } = await createOrder({
      customer: { name: customer.name.trim(), email: customer.email.trim().toLowerCase(), phone: customer.phone.trim() },
      shippingAddress: {
        street: shippingAddress.street.trim(),
        city: shippingAddress.city.trim(),
        zip: shippingAddress.zip?.trim() ?? null,
      },
      lineItems,
      totals,
      notes: notes?.trim() || null,
    });

    // -------- יצירת דף תשלום (best-effort) --------
    let paymentUrl = null;
    let paymentMock = false;
    try {
      const returnUrl = `${config.publicUrl}/api/payments/return/${encodeURIComponent(order.order_number)}`;
      const callbackUrl = `${config.publicUrl}/api/payments/webhook`;
      const result = await createPaymentPage({
        order, items: savedItems, returnUrl, callbackUrl,
      });
      paymentUrl = result.paymentUrl;
      paymentMock = result.mock;
      await updateOrderStatus(order.order_number, { payplus_page_uid: result.pageRequestUid });
    } catch (e) {
      // אם PayPlus נכשל - ההזמנה עדיין נשמרה; הלקוח יוכל לנסות שוב מדף ה-confirmation
      console.error('[orders] createPaymentPage failed:', e.message);
    }

    const response = formatOrderResponse(order, savedItems);
    response.paymentUrl = paymentUrl;
    response.paymentMock = paymentMock;
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

// -------- GET /api/orders/:orderNumber --------
router.get('/:orderNumber', async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const rec = await getOrderByNumber(orderNumber);
    if (!rec) return res.status(404).json({ error: 'הזמנה לא נמצאה' });
    res.json(formatOrderResponse(rec.order, rec.items));
  } catch (err) {
    next(err);
  }
});

// פורמט תגובה אחיד - ממיר snake_case של DB ל-camelCase של JSON
function formatOrderResponse(order, items) {
  return {
    order: {
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      customer: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
      },
      shippingAddress: order.shipping_address,
      notes: order.notes,
      totals: {
        subtotalExVat: Number(order.subtotal),
        vat: Number(order.tax),
        shipping: Number(order.shipping),
        total: Number(order.total),
      },
      createdAt: order.created_at,
    },
    items: items.map(it => ({
      name: it.product_name,
      sku: it.product_sku,
      unitPrice: Number(it.unit_price),
      quantity: it.quantity,
      lineTotal: Number(it.line_total),
    })),
  };
}

export default router;
