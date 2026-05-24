// ============================================
// API נתיבי תשלום (PayPlus)
// POST /api/payments/create/:orderNumber  - יוצר דף תשלום
// POST /api/payments/webhook              - PayPlus IPN callback
// GET  /api/payments/return/:orderNumber  - PayPlus redirect חזרה
// POST /api/payments/mock-callback        - רק במצב פיתוח
// ============================================
import express from 'express';
import { config, usingPlaceholders } from '../config.js';
import { createPaymentPage, verifyTransaction } from '../services/payplus.js';
import { getOrderByNumber, updateOrderStatus, decrementStock } from '../services/order-store.js';
import { sendOrderPaidEmails } from '../services/email.js';

const router = express.Router();

// ============================================
// POST /api/payments/create/:orderNumber
// יוצר דף תשלום עבור הזמנה קיימת.
// משמש את הfrontend לקבלת payment URL מחדש (למשל retry אחרי כישלון).
// ============================================
router.post('/create/:orderNumber', async (req, res, next) => {
  try {
    const rec = await getOrderByNumber(req.params.orderNumber);
    if (!rec) return res.status(404).json({ error: 'הזמנה לא נמצאה' });
    if (rec.order.payment_status === 'paid') {
      return res.status(400).json({ error: 'הזמנה זו כבר שולמה' });
    }

    const returnUrl = `${config.publicUrl}/api/payments/return/${encodeURIComponent(rec.order.order_number)}`;
    const callbackUrl = `${config.publicUrl}/api/payments/webhook`;

    const result = await createPaymentPage({
      order: rec.order, items: rec.items, returnUrl, callbackUrl,
    });

    // נשמור את page_request_uid כדי שאפשר יהיה לקשר אותו בעתיד
    await updateOrderStatus(rec.order.order_number, {
      payplus_page_uid: result.pageRequestUid,
    });

    res.json({ paymentUrl: result.paymentUrl, mock: result.mock });
  } catch (err) {
    next(err);
  }
});

// ============================================
// GET /api/payments/return/:orderNumber
// PayPlus מעביר את הלקוח לכאן אחרי תשלום.
// אנחנו מעבירים לדף תודה - הסטטוס האמיתי מגיע מהwebhook בנפרד.
// ============================================
router.get('/return/:orderNumber', (req, res) => {
  const status = req.query.status || 'unknown';
  const url = `/order-confirmation?order=${encodeURIComponent(req.params.orderNumber)}&payment=${encodeURIComponent(status)}`;
  res.redirect(url);
});

// ============================================
// POST /api/payments/webhook
// PayPlus שולח לכאן הודעה כשעסקה הסתיימה.
// זוהי האמת האמינה היחידה - העברה לפי redirect בלבד פגיעה.
// ============================================
router.post('/webhook', async (req, res, next) => {
  try {
    const body = req.body || {};
    // PayPlus עשוי לשלוח את המידע בפורמטים שונים
    const tx = body.transaction || body.data || body;
    const orderNumber = tx.more_info || tx.custom_invoice_name;
    const transactionUid = tx.transaction_uid || tx.uid;

    if (!orderNumber) {
      console.warn('[webhook] missing order reference', body);
      return res.status(400).json({ error: 'missing order reference' });
    }

    // ===== אימות מול PayPlus (לא סומכים על body!) =====
    const verified = await verifyTransaction(transactionUid);
    if (!verified) {
      console.warn('[webhook] verification failed for', transactionUid);
      return res.status(400).json({ error: 'verification failed' });
    }

    await handlePaymentResult({
      orderNumber,
      approved: verified.approved,
      transactionUid,
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ============================================
// POST /api/payments/mock-callback
// משמש את mock-payment.html בלבד. זמין רק כאשר אין credentials של PayPlus.
// ============================================
router.post('/mock-callback', async (req, res, next) => {
  if (!usingPlaceholders.payplus) {
    return res.status(404).json({ error: 'mock callback disabled in production mode' });
  }
  try {
    const { orderNumber, approved } = req.body || {};
    if (!orderNumber) return res.status(400).json({ error: 'orderNumber נדרש' });

    const result = await handlePaymentResult({
      orderNumber,
      approved: !!approved,
      transactionUid: 'mock-tx-' + Date.now(),
    });

    if (!result) return res.status(404).json({ error: 'הזמנה לא נמצאה' });
    res.json({ ok: true, approved: !!approved });
  } catch (err) {
    next(err);
  }
});

// ============================================
// משותף: עדכון הזמנה + הפחתת מלאי + טריגר למייל (שלב 5)
// idempotent: קריאות חוזרות עם אותה הצלחה לא יזיקו.
// ============================================
async function handlePaymentResult({ orderNumber, approved, transactionUid }) {
  const rec = await getOrderByNumber(orderNumber);
  if (!rec) return null;

  // idempotency - אם כבר שולם, לא נעשה שוב
  if (rec.order.payment_status === 'paid' && approved) {
    return rec;
  }

  const patch = {
    payment_status: approved ? 'paid' : 'failed',
    status: approved ? 'paid' : 'pending',
    payplus_transaction_uid: transactionUid,
    paid_at: approved ? new Date().toISOString() : null,
  };
  const updated = await updateOrderStatus(orderNumber, patch);

  if (approved) {
    try { await decrementStock(rec.items); }
    catch (e) { console.error('[payments] decrementStock failed:', e.message); }
    // שליחת מיילים (לא חוסם - לא נכשיל את ה-webhook אם המייל נכשל)
    sendOrderPaidEmails(updated.order, rec.items).catch(e =>
      console.error('[payments] email send failed:', e.message)
    );
  }
  return updated;
}

export default router;
