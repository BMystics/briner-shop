// ============================================
// תבניות HTML למיילים (RTL, עברית)
// ============================================
// טיפ: מיילים תומכים רק ב-CSS inline. אסור class חיצוני.
// טיפ: רוחב מקסימלי ~600px, פונט בסיסי (Arial fallback ל-Heebo).
// ============================================
import { config } from '../config.js';

const fmt = (n) => '₪' + Number(n).toFixed(2).replace(/\.00$/, '');

const COLORS = {
  navy: '#0B78BB',
  navyDark: '#085E92',
  orange: '#F5901A',
  textDark: '#1a1e2e',
  textMid: '#3d4460',
  textLight: '#6B7A9A',
  bg: '#F5F7FA',
  border: '#DDE3EE',
  success: '#16a34a',
};

function wrap(content, preheader = '') {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ברינר 3D</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:'Heebo',Arial,sans-serif;color:${COLORS.textDark};direction:rtl">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${COLORS.bg}">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
  <tr><td style="background:linear-gradient(135deg,${COLORS.navyDark},${COLORS.navy});padding:24px 32px;text-align:center;color:#fff">
    <div style="font-size:24px;font-weight:900">ברינר<span style="color:${COLORS.orange}">3D</span></div>
    <div style="font-size:13px;opacity:0.85;margin-top:4px">פילמנטים להדפסת תלת-ממד</div>
  </td></tr>
  <tr><td style="padding:32px">${content}</td></tr>
  <tr><td style="background:#0D1A2A;color:rgba(255,255,255,0.5);padding:20px 32px;font-size:12px;text-align:center">
    © ${new Date().getFullYear()} ג. ברינר · כל הזכויות שמורות<br>
    <a href="${config.publicUrl}" style="color:${COLORS.orange};text-decoration:none">${config.publicUrl}</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function itemsTable(items) {
  const rows = items.map(it => `
    <tr>
      <td style="padding:10px 6px;border-bottom:1px solid ${COLORS.border};font-size:14px">${escape(it.product_name || it.name)}</td>
      <td style="padding:10px 6px;border-bottom:1px solid ${COLORS.border};font-size:14px;text-align:center">${it.quantity}</td>
      <td style="padding:10px 6px;border-bottom:1px solid ${COLORS.border};font-size:14px;text-align:left;font-weight:700">${fmt(it.line_total || it.lineTotal || (it.unit_price || it.unitPrice) * it.quantity)}</td>
    </tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0">
    <tr><th style="text-align:right;padding:8px 6px;font-size:12px;color:${COLORS.textLight};border-bottom:2px solid ${COLORS.border}">מוצר</th>
        <th style="text-align:center;padding:8px 6px;font-size:12px;color:${COLORS.textLight};border-bottom:2px solid ${COLORS.border}">כמות</th>
        <th style="text-align:left;padding:8px 6px;font-size:12px;color:${COLORS.textLight};border-bottom:2px solid ${COLORS.border}">סה"כ</th></tr>
    ${rows}
  </table>`;
}

function totalsBlock(order) {
  const t = {
    subtotal: Number(order.subtotal),
    vat: Number(order.tax),
    shipping: Number(order.shipping),
    total: Number(order.total),
  };
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px">
    <tr><td style="padding:6px 0;font-size:14px;color:${COLORS.textMid}">סכום לפני מע"מ</td><td style="padding:6px 0;font-size:14px;text-align:left">${fmt(t.subtotal)}</td></tr>
    <tr><td style="padding:6px 0;font-size:14px;color:${COLORS.textMid}">מע"מ</td><td style="padding:6px 0;font-size:14px;text-align:left">${fmt(t.vat)}</td></tr>
    <tr><td style="padding:6px 0;font-size:14px;color:${t.shipping===0?COLORS.success:COLORS.textMid};font-weight:${t.shipping===0?'700':'400'}">משלוח</td><td style="padding:6px 0;font-size:14px;text-align:left;color:${t.shipping===0?COLORS.success:COLORS.textMid};font-weight:${t.shipping===0?'700':'400'}">${t.shipping===0?'חינם!':fmt(t.shipping)}</td></tr>
    <tr><td style="padding:14px 0 0;font-size:18px;font-weight:900;border-top:2px solid ${COLORS.border}">סה"כ</td><td style="padding:14px 0 0;font-size:18px;font-weight:900;text-align:left;border-top:2px solid ${COLORS.border}">${fmt(t.total)}</td></tr>
  </table>`;
}

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));
}

// ====== מייל ללקוח - אישור הזמנה ושולמה ======
export function customerOrderPaidEmail(order, items) {
  const addr = order.shipping_address || {};
  const content = `
    <div style="background:${COLORS.success};color:#fff;text-align:center;padding:20px;border-radius:8px;margin-bottom:24px">
      <div style="font-size:32px;margin-bottom:6px">✓</div>
      <div style="font-size:20px;font-weight:800">תודה ${escape(order.customer_name?.split(' ')[0] || '')}! התשלום התקבל</div>
    </div>
    <p style="font-size:15px;line-height:1.7;color:${COLORS.textMid}">
      קיבלנו את ההזמנה שלך ואנחנו מתחילים להכין אותה. תקבל עדכון כשהיא יוצאת למשלוח.
    </p>
    <div style="background:${COLORS.bg};border-radius:8px;padding:16px;margin:20px 0;text-align:center">
      <div style="font-size:12px;color:${COLORS.textLight};margin-bottom:4px">מספר הזמנה</div>
      <div style="font-size:22px;font-weight:900;color:${COLORS.navy};font-family:monospace;letter-spacing:1px">${escape(order.order_number)}</div>
    </div>
    <h2 style="font-size:16px;font-weight:800;margin:24px 0 8px;color:${COLORS.textDark}">פריטים בהזמנה</h2>
    ${itemsTable(items)}
    ${totalsBlock(order)}
    <h2 style="font-size:16px;font-weight:800;margin:24px 0 8px;color:${COLORS.textDark}">פרטי משלוח</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:4px 0;color:${COLORS.textLight};font-size:13px">שם</td><td style="padding:4px 0;font-size:14px;text-align:left">${escape(order.customer_name)}</td></tr>
      <tr><td style="padding:4px 0;color:${COLORS.textLight};font-size:13px">טלפון</td><td style="padding:4px 0;font-size:14px;text-align:left">${escape(order.customer_phone)}</td></tr>
      <tr><td style="padding:4px 0;color:${COLORS.textLight};font-size:13px">כתובת</td><td style="padding:4px 0;font-size:14px;text-align:left">${escape([addr.street, addr.city, addr.zip].filter(Boolean).join(', '))}</td></tr>
    </table>
    <div style="margin-top:32px;text-align:center">
      <a href="${config.publicUrl}/order-confirmation?order=${encodeURIComponent(order.order_number)}" style="display:inline-block;background:${COLORS.navy};color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px">צפייה בפרטי ההזמנה</a>
    </div>
    <p style="font-size:13px;color:${COLORS.textLight};margin-top:24px;text-align:center">
      שאלות? השב למייל זה או צור איתנו קשר.
    </p>`;
  return {
    subject: `אישור הזמנה ${order.order_number} - ברינר 3D`,
    html: wrap(content, `תודה על ההזמנה! מספר הזמנה: ${order.order_number}`),
  };
}

// ====== מייל למנהל - הזמנה חדשה שולמה ======
export function adminNewOrderEmail(order, items) {
  const addr = order.shipping_address || {};
  const content = `
    <div style="background:${COLORS.navy};color:#fff;padding:16px;border-radius:8px;margin-bottom:20px;text-align:center">
      <div style="font-size:14px;opacity:0.85">הזמנה חדשה שולמה</div>
      <div style="font-size:22px;font-weight:900;font-family:monospace;letter-spacing:1px;margin-top:4px">${escape(order.order_number)}</div>
      <div style="font-size:24px;font-weight:900;color:${COLORS.orange};margin-top:8px">${fmt(order.total)}</div>
    </div>
    <h2 style="font-size:16px;font-weight:800;margin:0 0 8px">פרטי לקוח</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
      <tr><td style="padding:4px 0;color:${COLORS.textLight};font-size:13px;width:80px">שם</td><td style="padding:4px 0;font-size:14px">${escape(order.customer_name)}</td></tr>
      <tr><td style="padding:4px 0;color:${COLORS.textLight};font-size:13px">אימייל</td><td style="padding:4px 0;font-size:14px"><a href="mailto:${escape(order.customer_email)}" style="color:${COLORS.navy}">${escape(order.customer_email)}</a></td></tr>
      <tr><td style="padding:4px 0;color:${COLORS.textLight};font-size:13px">טלפון</td><td style="padding:4px 0;font-size:14px"><a href="tel:${escape(order.customer_phone)}" style="color:${COLORS.navy}">${escape(order.customer_phone)}</a></td></tr>
      <tr><td style="padding:4px 0;color:${COLORS.textLight};font-size:13px;vertical-align:top">כתובת</td><td style="padding:4px 0;font-size:14px">${escape([addr.street, addr.city, addr.zip].filter(Boolean).join(', '))}</td></tr>
      ${order.notes ? `<tr><td style="padding:4px 0;color:${COLORS.textLight};font-size:13px;vertical-align:top">הערות</td><td style="padding:4px 0;font-size:14px;font-style:italic">${escape(order.notes)}</td></tr>` : ''}
    </table>
    <h2 style="font-size:16px;font-weight:800;margin:0 0 8px">פריטים</h2>
    ${itemsTable(items)}
    ${totalsBlock(order)}
    <div style="margin-top:24px;text-align:center">
      <a href="${config.publicUrl}/admin" style="display:inline-block;background:${COLORS.orange};color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px">לפאנל הניהול</a>
    </div>`;
  return {
    subject: `🔔 הזמנה חדשה ${order.order_number} - ${fmt(order.total)}`,
    html: wrap(content, `הזמנה חדשה שולמה: ${order.order_number} בסכום ${fmt(order.total)}`),
  };
}
