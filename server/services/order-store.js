// ============================================
// Order Store - אבסטרקציה על Supabase / mock זיכרון
// ============================================
// כל הגישה ל-DB של הזמנות עוברת מכאן.
// אם credentials של Supabase הם placeholders - עובד מול Map בזיכרון.
// כשתעבור ל-Supabase אמיתי, אף קוד אחר לא צריך להשתנות.
// ============================================
import { getSupabase } from '../db/supabase.js';
import { mockProducts } from '../db/mock-data.js';
import { usingPlaceholders } from '../config.js';

// ============== Mock store בזיכרון ==============
const mockOrders = new Map(); // orderNumber -> {order, items}
let mockSeq = 0;
function mockOrderNumber() {
  mockSeq += 1;
  const yr = new Date().getFullYear();
  return `BRN-${yr}-${String(mockSeq).padStart(4, '0')}`;
}

// ============== Helpers ==============

// מושך פרטי מוצרים מ-DB/Mock לפי handles
async function fetchProductsByHandles(handles) {
  if (usingPlaceholders.supabase) {
    return mockProducts.filter(p => handles.includes(p.handle) && p.is_active);
  }
  const sb = getSupabase();
  const { data, error } = await sb
    .from('products')
    .select('id, handle, name, sku, price, stock, is_active')
    .in('handle', handles)
    .eq('is_active', true);
  if (error) throw error;
  return data;
}

// ============== Public API ==============

/**
 * יוצר הזמנה חדשה.
 * @param {object} params
 * @param {object} params.customer  - {name, email, phone}
 * @param {object} params.shippingAddress - {street, city, zip}
 * @param {Array}  params.lineItems - [{product, quantity}] (product = רשומה שלמה מ-DB)
 * @param {object} params.totals    - תוצאת calculateOrderTotals
 * @param {string} [params.notes]
 * @returns {{order, items}}
 */
export async function createOrder({ customer, shippingAddress, lineItems, totals, notes }) {
  if (usingPlaceholders.supabase) {
    const orderNumber = mockOrderNumber();
    const order = {
      order_number: orderNumber,
      customer_email: customer.email,
      customer_name: customer.name,
      customer_phone: customer.phone,
      status: 'pending',
      payment_status: 'pending',
      subtotal: totals.subtotalExVat,
      tax: totals.vat,
      shipping: totals.shipping,
      total: totals.total,
      shipping_address: shippingAddress,
      notes: notes ?? null,
      created_at: new Date().toISOString(),
    };
    const items = lineItems.map(li => ({
      product_id: li.product.id,
      product_name: li.product.name,
      product_sku: li.product.sku ?? null,
      unit_price: li.product.price,
      quantity: li.quantity,
      line_total: Math.round(li.product.price * li.quantity * 100) / 100,
    }));
    mockOrders.set(orderNumber, { order, items });
    return { order, items };
  }

  // ----- Supabase אמיתי -----
  const sb = getSupabase();

  // מספר הזמנה מהפונקציה ב-DB
  const { data: numData, error: numErr } = await sb.rpc('generate_order_number');
  if (numErr) throw numErr;
  const orderNumber = numData;

  const orderRow = {
    order_number: orderNumber,
    customer_email: customer.email,
    customer_name: customer.name,
    customer_phone: customer.phone,
    status: 'pending',
    payment_status: 'pending',
    subtotal: totals.subtotalExVat,
    tax: totals.vat,
    shipping: totals.shipping,
    total: totals.total,
    shipping_address: shippingAddress,
    notes: notes ?? null,
  };

  const { data: order, error: orderErr } = await sb
    .from('orders').insert(orderRow).select().single();
  if (orderErr) throw orderErr;

  const itemRows = lineItems.map(li => ({
    order_id: order.id,
    product_id: li.product.id,
    product_name: li.product.name,
    product_sku: li.product.sku ?? null,
    unit_price: li.product.price,
    quantity: li.quantity,
    line_total: Math.round(li.product.price * li.quantity * 100) / 100,
  }));

  const { data: items, error: itemsErr } = await sb
    .from('order_items').insert(itemRows).select();
  if (itemsErr) throw itemsErr;

  return { order, items };
}

export async function getOrderByNumber(orderNumber) {
  if (usingPlaceholders.supabase) {
    return mockOrders.get(orderNumber) ?? null;
  }
  const sb = getSupabase();
  const { data: order, error: orderErr } = await sb
    .from('orders').select('*').eq('order_number', orderNumber).maybeSingle();
  if (orderErr) throw orderErr;
  if (!order) return null;
  const { data: items, error: itemsErr } = await sb
    .from('order_items').select('*').eq('order_id', order.id);
  if (itemsErr) throw itemsErr;
  return { order, items: items ?? [] };
}

export async function listOrders({ status, search, limit = 100 } = {}) {
  if (usingPlaceholders.supabase) {
    let arr = Array.from(mockOrders.values());
    if (status) arr = arr.filter(o => o.order.status === status);
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(o =>
        o.order.order_number.toLowerCase().includes(q) ||
        o.order.customer_email.toLowerCase().includes(q) ||
        (o.order.customer_name || '').toLowerCase().includes(q)
      );
    }
    arr.sort((a, b) => b.order.created_at.localeCompare(a.order.created_at));
    return arr.slice(0, limit);
  }
  const sb = getSupabase();
  let q = sb.from('orders').select('*').order('created_at', { ascending: false }).limit(limit);
  if (status) q = q.eq('status', status);
  if (search) {
    q = q.or(`order_number.ilike.%${search}%,customer_email.ilike.%${search}%,customer_name.ilike.%${search}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data.map(order => ({ order, items: [] }));
}

export async function getOrderStats() {
  if (usingPlaceholders.supabase) {
    const all = Array.from(mockOrders.values()).map(o => o.order);
    return computeStats(all);
  }
  const sb = getSupabase();
  const { data, error } = await sb.from('orders').select('status,payment_status,total,created_at');
  if (error) throw error;
  return computeStats(data);
}

function computeStats(orders) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekAgo = today - 7 * 24 * 3600 * 1000;
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let total = 0, paid = 0, pending = 0, revenue = 0;
  let revenueToday = 0, revenueWeek = 0, revenueMonth = 0;

  for (const o of orders) {
    total++;
    if (o.payment_status === 'paid') {
      paid++;
      const amt = Number(o.total) || 0;
      revenue += amt;
      const t = new Date(o.created_at).getTime();
      if (t >= today) revenueToday += amt;
      if (t >= weekAgo) revenueWeek += amt;
      if (t >= monthAgo) revenueMonth += amt;
    } else if (o.payment_status === 'pending') {
      pending++;
    }
  }
  return {
    totalOrders: total,
    paidOrders: paid,
    pendingOrders: pending,
    revenueTotal: Math.round(revenue * 100) / 100,
    revenueToday: Math.round(revenueToday * 100) / 100,
    revenueWeek: Math.round(revenueWeek * 100) / 100,
    revenueMonth: Math.round(revenueMonth * 100) / 100,
  };
}

export async function updateOrderStatus(orderNumber, patch) {
  if (usingPlaceholders.supabase) {
    const rec = mockOrders.get(orderNumber);
    if (!rec) return null;
    Object.assign(rec.order, patch, { updated_at: new Date().toISOString() });
    return rec;
  }
  const sb = getSupabase();
  const { data, error } = await sb
    .from('orders').update(patch).eq('order_number', orderNumber).select().single();
  if (error) throw error;
  return data ? { order: data, items: [] } : null;
}

/**
 * מפחית מלאי. נקרא לאחר אישור תשלום.
 * items = [{product_id, product_name, quantity}]
 * החלטה: בודקים אם handle עדיין קיים. אם handle כבר נמחק (product_id=null), מדלגים בלי שגיאה
 * כי ההזמנה כבר נסגרה לפי snapshot.
 */
export async function decrementStock(items) {
  if (usingPlaceholders.supabase) {
    for (const it of items) {
      const p = mockProducts.find(m => m.id === it.product_id);
      if (p) p.stock = Math.max(0, (p.stock || 0) - Number(it.quantity));
    }
    return;
  }
  const sb = getSupabase();
  // אין UPDATE ... -= ב-PostgREST. נשתמש ב-RPC או fetch+update.
  for (const it of items) {
    if (!it.product_id) continue;
    const { data: cur, error: e1 } = await sb
      .from('products').select('stock').eq('id', it.product_id).maybeSingle();
    if (e1 || !cur) continue;
    const newStock = Math.max(0, Number(cur.stock || 0) - Number(it.quantity));
    await sb.from('products').update({ stock: newStock }).eq('id', it.product_id);
  }
}

export { fetchProductsByHandles };
