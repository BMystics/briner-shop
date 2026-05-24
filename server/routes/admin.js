// ============================================
// API נתיבי ניהול - מוגן ב-adminAuth
// ============================================
import express from 'express';
import { listOrders, getOrderByNumber, updateOrderStatus, getOrderStats }
  from '../services/order-store.js';
import { assert, ValidationError } from '../middleware/validate.js';

const router = express.Router();

const ALLOWED_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

// ============== GET /api/admin/stats ==============
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await getOrderStats();
    res.json(stats);
  } catch (err) { next(err); }
});

// ============== GET /api/admin/orders ==============
// query: ?status=pending&search=text&limit=50
router.get('/orders', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const records = await listOrders({ status, search, limit });
    const orders = records.map(r => ({
      orderNumber: r.order.order_number,
      status: r.order.status,
      paymentStatus: r.order.payment_status,
      customerName: r.order.customer_name,
      customerEmail: r.order.customer_email,
      customerPhone: r.order.customer_phone,
      total: Number(r.order.total),
      createdAt: r.order.created_at,
      paidAt: r.order.paid_at,
    }));
    res.json({ orders, count: orders.length });
  } catch (err) { next(err); }
});

// ============== GET /api/admin/orders/:orderNumber ==============
router.get('/orders/:orderNumber', async (req, res, next) => {
  try {
    const rec = await getOrderByNumber(req.params.orderNumber);
    if (!rec) return res.status(404).json({ error: 'הזמנה לא נמצאה' });
    res.json({
      order: {
        orderNumber: rec.order.order_number,
        status: rec.order.status,
        paymentStatus: rec.order.payment_status,
        customerName: rec.order.customer_name,
        customerEmail: rec.order.customer_email,
        customerPhone: rec.order.customer_phone,
        shippingAddress: rec.order.shipping_address,
        notes: rec.order.notes,
        subtotal: Number(rec.order.subtotal),
        vat: Number(rec.order.tax),
        shipping: Number(rec.order.shipping),
        total: Number(rec.order.total),
        payplusTransactionUid: rec.order.payplus_transaction_uid,
        createdAt: rec.order.created_at,
        paidAt: rec.order.paid_at,
      },
      items: rec.items.map(it => ({
        name: it.product_name,
        sku: it.product_sku,
        unitPrice: Number(it.unit_price),
        quantity: it.quantity,
        lineTotal: Number(it.line_total),
      })),
    });
  } catch (err) { next(err); }
});

// ============== PATCH /api/admin/orders/:orderNumber ==============
// body: {status?: string, notes?: string}
router.patch('/orders/:orderNumber', async (req, res, next) => {
  try {
    const { status, notes } = req.body || {};
    const patch = {};

    if (status !== undefined) {
      assert(ALLOWED_STATUSES.includes(status), `סטטוס לא חוקי: ${status}`, 'status');
      patch.status = status;
    }
    if (notes !== undefined) patch.notes = String(notes).slice(0, 1000);

    assert(Object.keys(patch).length > 0, 'לא נשלחו שינויים');

    const updated = await updateOrderStatus(req.params.orderNumber, patch);
    if (!updated) return res.status(404).json({ error: 'הזמנה לא נמצאה' });

    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
