// ============================================
// טוען פרטי הזמנה ומציג סטטוס תשלום מעודכן
// ============================================
// תרחישים:
//  ?payment=success - לקוח חזר מ-PayPlus, נצפה לראות paid (אולי אחרי polling)
//  ?payment=failure / cancel - תשלום נכשל, מציגים retry
//  אין param - לקוח הגיע ישירות (למשל מקישור באימייל)
// ============================================
(function () {
  const fmt = (n) => '₪' + Number(n).toFixed(2).replace(/\.00$/, '');
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const STATUS_HE = {
    pending: 'ממתינה לתשלום',
    paid: 'שולמה',
    processing: 'בהכנה',
    shipped: 'נשלחה',
    delivered: 'נמסרה',
    cancelled: 'בוטלה',
    refunded: 'הוחזרה',
  };

  let orderNumber = '';
  let paymentParam = '';
  let pollTimer = null;
  let pollAttempts = 0;
  const POLL_INTERVAL = 1500;
  const MAX_POLLS = 20; // ~30 שניות

  async function load() {
    const params = new URLSearchParams(window.location.search);
    orderNumber = params.get('order') || '';
    paymentParam = params.get('payment') || '';
    if (!orderNumber) return showError('לא צוין מספר הזמנה');

    try {
      const data = await window.api.get(`/api/orders/${encodeURIComponent(orderNumber)}`);
      render(data);
      maybeStartPolling(data.order);
    } catch (err) {
      showError(err.message || 'שגיאה בטעינת ההזמנה');
    }
  }

  function render({ order, items }) {
    $('loading').style.display = 'none';
    $('content').style.display = '';

    $('orderNumber').textContent = order.orderNumber;
    $('d-name').textContent = order.customer.name;
    $('d-email').textContent = order.customer.email;
    $('d-phone').textContent = order.customer.phone;
    const addr = order.shippingAddress || {};
    $('d-address').textContent = [addr.street, addr.city, addr.zip].filter(Boolean).join(', ');
    if (order.notes) {
      $('d-notes-row').style.display = '';
      $('d-notes').textContent = order.notes;
    }
    $('d-status').textContent = STATUS_HE[order.status] || order.status;

    $('itemsBody').innerHTML = items.map(it => `
      <tr>
        <td>${esc(it.name)}</td>
        <td>${fmt(it.unitPrice)}</td>
        <td>${it.quantity}</td>
        <td><strong>${fmt(it.lineTotal)}</strong></td>
      </tr>
    `).join('');

    const t = order.totals;
    $('t-subtotal').textContent = fmt(t.subtotalExVat);
    $('t-vat').textContent = fmt(t.vat);
    if (t.shipping === 0) {
      $('t-shipping').textContent = 'חינם!';
      $('shipping-row').classList.add('free');
    } else {
      $('t-shipping').textContent = fmt(t.shipping);
    }
    $('t-total').textContent = fmt(t.total);

    renderPaymentState(order);
  }

  function renderPaymentState(order) {
    const hero = $('heroBox');
    const icon = $('heroIcon');
    const title = $('heroTitle');
    const subtitle = $('heroSubtitle');
    const heading = $('paymentHeading');
    const text = $('paymentText');
    const btn = $('btnPay');

    hero.classList.remove('pending', 'failed');
    btn.style.display = 'none';
    btn.onclick = null;

    if (order.paymentStatus === 'paid') {
      icon.textContent = '✓';
      title.textContent = 'תודה! התשלום התקבל';
      subtitle.textContent = 'ההזמנה אושרה ותעובד בהקדם. העתק יישלח אליך באימייל.';
      heading.textContent = 'סטטוס תשלום';
      text.innerHTML = '<span style="color:#16a34a;font-weight:700">✓ התשלום בוצע בהצלחה</span>';
    } else if (order.paymentStatus === 'failed' || paymentParam === 'failure' || paymentParam === 'cancel') {
      hero.classList.add('failed');
      icon.textContent = '✕';
      title.textContent = 'התשלום לא הושלם';
      subtitle.textContent = 'ההזמנה נשמרה אך התשלום נכשל. תוכל לנסות שוב.';
      heading.textContent = 'תשלום נכשל';
      text.textContent = 'אנא נסה שוב או צור איתנו קשר.';
      btn.style.display = '';
      btn.textContent = 'נסה שוב לשלם';
      btn.onclick = retryPayment;
    } else if (paymentParam === 'success') {
      // חזרנו מסליקה אבל ה-webhook עוד לא עידכן - נמתין
      hero.classList.add('pending');
      icon.textContent = '⟳';
      title.textContent = 'מעבד תשלום...';
      subtitle.textContent = 'התשלום שודר. ממתינים לאישור מהבנק (עד 30 שניות).';
      heading.textContent = 'סטטוס תשלום';
      text.textContent = 'אנא המתן ואל תסגור את הדף.';
    } else {
      // pending - לקוח חזר לדף בלי לעבור סליקה (אולי שמר קישור)
      hero.classList.add('pending');
      icon.textContent = '!';
      title.textContent = 'ההזמנה ממתינה לתשלום';
      subtitle.textContent = 'יש להשלים את התשלום כדי לעבד את ההזמנה.';
      heading.textContent = 'תשלום נדרש';
      text.textContent = '';
      btn.style.display = '';
      btn.textContent = 'מעבר לתשלום ←';
      btn.onclick = retryPayment;
    }
  }

  function maybeStartPolling(order) {
    if (pollTimer) return;
    // נריץ polling רק אם חזרנו מסליקה והסטטוס עוד pending
    if (paymentParam === 'success' && order.paymentStatus === 'pending') {
      pollTimer = setInterval(poll, POLL_INTERVAL);
    }
  }

  async function poll() {
    pollAttempts++;
    try {
      const data = await window.api.get(`/api/orders/${encodeURIComponent(orderNumber)}`);
      if (data.order.paymentStatus !== 'pending' || pollAttempts >= MAX_POLLS) {
        clearInterval(pollTimer);
        pollTimer = null;
        render(data); // re-render כולל סטטוס חדש
      }
    } catch {
      // נמשיך לנסות
    }
  }

  async function retryPayment() {
    const btn = $('btnPay');
    btn.disabled = true;
    btn.textContent = 'מעביר...';
    try {
      const res = await window.api.post(`/api/payments/create/${encodeURIComponent(orderNumber)}`);
      if (res.paymentUrl) {
        location.href = res.paymentUrl;
      } else {
        alert('שגיאה ביצירת דף תשלום');
        btn.disabled = false;
        btn.textContent = 'מעבר לתשלום ←';
      }
    } catch (err) {
      alert(err.message || 'שגיאה ביצירת דף תשלום');
      btn.disabled = false;
      btn.textContent = 'נסה שוב';
    }
  }

  function showError(message) {
    $('loading').style.display = 'none';
    const err = $('errorState');
    err.style.display = '';
    err.innerHTML = `<div style="font-size:48px;margin-bottom:8px">⚠</div>
      <div style="font-size:18px;font-weight:600;margin-bottom:14px">${esc(message)}</div>
      <a href="/filaments" style="color:var(--navy);font-weight:700">חזרה לחנות</a>`;
  }

  document.addEventListener('DOMContentLoaded', load);
})();
