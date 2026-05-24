// ============================================
// לוגיקת דף ה-checkout
// ============================================
(function () {
  const fmt = (n) => '₪' + Number(n).toFixed(2).replace(/\.00$/, '');
  const VAT_RATE = 0.18; // לתצוגה בלבד - השרת מחשב את האמת

  const $ = (id) => document.getElementById(id);
  const emptyState = $('emptyState');
  const grid = $('checkoutGrid');
  const itemsEl = $('summaryItems');
  const btn = $('btnSubmit');
  const errorEl = $('globalError');

  function renderSummary() {
    const items = window.cart.items;
    if (!items.length) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }
    grid.style.display = '';
    emptyState.style.display = 'none';

    itemsEl.innerHTML = items.map(i => `
      <div class="summary-item">
        ${i.img ? `<img class="summary-img" src="${escapeHtml(i.img)}" alt="">` : '<div class="summary-img"></div>'}
        <div class="summary-info">
          <div class="summary-name">${escapeHtml(i.name)}</div>
          <div class="summary-qty">כמות: ${i.qty} × ${fmt(i.price)}</div>
        </div>
        <div class="summary-price">${fmt(i.price * i.qty)}</div>
      </div>
    `).join('');

    const subtotalInVat = items.reduce((s, i) => s + i.price * i.qty, 0);
    const subtotalExVat = subtotalInVat / (1 + VAT_RATE);
    const vat = subtotalInVat - subtotalExVat;
    const shipping = subtotalInVat >= 200 ? 0 : 30; // לתצוגה - בפועל השרת מחזיר את האמת
    const total = subtotalInVat + shipping;

    $('t-subtotal').textContent = fmt(subtotalExVat);
    $('t-vat').textContent = fmt(vat);
    $('t-vatRate').textContent = `(${Math.round(VAT_RATE * 100)}%)`;
    if (shipping === 0) {
      $('t-shipping').textContent = 'חינם!';
      $('t-shipping').className = 'amount';
      $('t-shipping').parentElement.classList.add('free');
    } else {
      $('t-shipping').textContent = fmt(shipping);
      $('t-shipping').parentElement.classList.remove('free');
    }
    $('t-total').textContent = fmt(total);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function clearErrors() {
    document.querySelectorAll('.field.error').forEach(f => f.classList.remove('error'));
    document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
    errorEl.classList.remove('show');
    errorEl.textContent = '';
  }

  function showFieldError(fieldPath, message) {
    const el = document.querySelector(`[data-field="${fieldPath}"]`);
    if (el) {
      el.classList.add('error');
      el.querySelector('.field-error').textContent = message;
      el.querySelector('input, textarea')?.focus();
    } else {
      showGlobalError(message);
    }
  }

  function showGlobalError(message) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function submit(e) {
    e.preventDefault();
    clearErrors();
    if (!window.cart.items.length) return;

    const body = {
      customer: {
        name: $('f-name').value.trim(),
        email: $('f-email').value.trim(),
        phone: $('f-phone').value.trim(),
      },
      shippingAddress: {
        street: $('f-street').value.trim(),
        city: $('f-city').value.trim(),
        zip: $('f-zip').value.trim(),
      },
      items: window.cart.items.map(i => ({ handle: i.handle, quantity: i.qty })),
      notes: $('f-notes').value.trim() || undefined,
    };

    btn.disabled = true;
    btn.textContent = 'שולח...';
    try {
      const res = await window.api.post('/api/orders', body);
      // מנקים את הסל מיד עם יצירת ההזמנה
      window.cart.clear();
      // אם נוצר דף תשלום - נעביר ישירות לסליקה
      if (res.paymentUrl) {
        btn.textContent = 'מעביר לסליקה...';
        window.location.href = res.paymentUrl;
      } else {
        // ההזמנה נשמרה אך הסליקה נכשלה - יציגו "נסה שוב" בדף התודה
        window.location.href = `/order-confirmation?order=${encodeURIComponent(res.order.orderNumber)}`;
      }
    } catch (err) {
      if (err.field) {
        showFieldError(err.field, err.message);
      } else {
        showGlobalError(err.message || 'שגיאה ביצירת ההזמנה');
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'אישור הזמנה ←';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderSummary();
    $('checkoutForm').addEventListener('submit', submit);
    window.addEventListener('cart:changed', renderSummary);
  });
})();
