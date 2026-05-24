// ============================================
// PayPlus client - יצירת דף תשלום ואימות עסקאות
// ============================================
// תיעוד: https://developers.payplus.co.il/api
//
// זרימה:
// 1. createPaymentPage() יוצר דף תשלום ומחזיר URL
// 2. הלקוח מועבר ל-URL ומבצע תשלום
// 3. PayPlus מבצע redirect חזרה ל-refURL_success/failure
// 4. במקביל PayPlus שולח webhook ל-refURL_callback (האמת היחידה האמינה)
// 5. verifyTransaction() מאשר מול PayPlus שהעסקה אכן הצליחה
// ============================================
import { config, usingPlaceholders } from '../config.js';

// PayPlus דורש Authorization header עם JSON של {api_key, secret_key}
function authHeader() {
  return JSON.stringify({
    api_key: config.payplus.apiKey,
    secret_key: config.payplus.secretKey,
  });
}

/**
 * יוצר דף תשלום ב-PayPlus.
 * @param {object} params
 * @param {object} params.order - רשומת ההזמנה (snake_case מ-DB)
 * @param {Array}  params.items - שורות ההזמנה
 * @param {string} params.returnUrl - URL להחזרת הלקוח
 * @param {string} params.callbackUrl - URL ל-webhook
 * @returns {{paymentUrl, pageRequestUid, mock}}
 */
export async function createPaymentPage({ order, items, returnUrl, callbackUrl }) {
  if (usingPlaceholders.payplus) {
    // ====== Mock mode ======
    return {
      paymentUrl: `${config.publicUrl}/mock-payment?order=${encodeURIComponent(order.order_number)}`,
      pageRequestUid: 'mock-' + order.order_number,
      mock: true,
    };
  }

  // ====== PayPlus אמיתי ======
  const payload = {
    payment_page_uid: config.payplus.paymentPageUid,
    amount: Number(order.total),
    currency_code: 'ILS',
    sendEmailApproval: true,
    sendEmailFailure: false,
    refURL_success: `${returnUrl}?status=success`,
    refURL_failure: `${returnUrl}?status=failure`,
    refURL_cancel: `${returnUrl}?status=cancel`,
    refURL_callback: callbackUrl,
    more_info: order.order_number,           // נחזור לכאן ב-webhook
    custom_invoice_name: order.order_number,
    items: items.map(it => ({
      name: it.product_name,
      quantity: Number(it.quantity),
      price: Number(it.unit_price),
      vat_type: 0, // 0 = מחיר כולל מע"מ (כמו שאנחנו עובדים)
    })),
    customer: {
      customer_name: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone,
    },
  };

  const res = await fetch(`${config.payplus.apiUrl}/PaymentPages/generateLink`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader(),
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('PayPlus: invalid JSON response: ' + text); }

  if (!res.ok || data?.results?.status !== 'success') {
    const msg = data?.results?.description || `HTTP ${res.status}`;
    throw new Error(`PayPlus rejected: ${msg}`);
  }

  return {
    paymentUrl: data.data.payment_page_link,
    pageRequestUid: data.data.page_request_uid,
    mock: false,
  };
}

/**
 * מאמת עסקה מול PayPlus (אסור לסמוך על body של webhook!)
 * @returns {{status, approved, transaction}|null}
 */
export async function verifyTransaction(transactionUid) {
  if (usingPlaceholders.payplus) return null;
  if (!transactionUid) return null;

  try {
    const res = await fetch(`${config.payplus.apiUrl}/Transactions/ViewTransaction/${transactionUid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader(),
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const tx = data?.data;
    if (!tx) return null;
    // status_code '000' = הצלחה ב-PayPlus
    const approved = tx.status_code === '000' || String(tx.status).toLowerCase() === 'approved';
    return { approved, transaction: tx };
  } catch (e) {
    console.error('[payplus verify] error:', e.message);
    return null;
  }
}
