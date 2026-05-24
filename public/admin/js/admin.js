// ============================================
// פאנל ניהול - JS לוגיקה
// ============================================
(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => '₪' + Number(n || 0).toLocaleString('he-IL', { maximumFractionDigits: 2 });
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));

  const STATUS_HE = {
    pending: 'ממתינה', paid: 'שולמה', processing: 'בהכנה',
    shipped: 'נשלחה', delivered: 'נמסרה', cancelled: 'בוטלה', refunded: 'הוחזרה',
  };
  const PAYMENT_HE = { pending: 'ממתין', paid: 'שולם', failed: 'נכשל', refunded: 'הוחזר' };

  let currentFilter = '';
  let currentSearch = '';
  let searchTimer = null;

  // ============== Stats ==============
  async function loadStats() {
    try {
      const s = await window.api.get('/api/admin/stats');
      $('s-total').textContent = s.totalOrders;
      $('s-paid').textContent = s.paidOrders;
      $('s-pending').textContent = s.pendingOrders;
      $('s-today').textContent = fmt(s.revenueToday);
      $('s-month').textContent = fmt(s.revenueMonth);
      $('s-revenue').textContent = fmt(s.revenueTotal);
    } catch (e) {
      toast('שגיאה בטעינת סטטיסטיקות: ' + e.message, true);
    }
  }

  // ============== Orders Table ==============
  async function loadOrders() {
    const body = $('ordersBody');
    const loading = $('ordersLoading');
    const empty = $('ordersEmpty');
    body.innerHTML = '';
    loading.style.display = '';
    empty.style.display = 'none';

    try {
      const params = new URLSearchParams();
      if (currentFilter) params.set('status', currentFilter);
      if (currentSearch) params.set('search', currentSearch);
      const data = await window.api.get('/api/admin/orders?' + params.toString());
      loading.style.display = 'none';

      if (!data.orders.length) { empty.style.display = ''; return; }

      body.innerHTML = data.orders.map(o => `
        <tr class="row" data-num="${esc(o.orderNumber)}">
          <td><span class="order-no">${esc(o.orderNumber)}</span></td>
          <td>${esc(o.customerName || '-')}</td>
          <td>${esc(o.customerEmail)}</td>
          <td><span class="badge ${esc(o.status)}">${STATUS_HE[o.status] || o.status}</span></td>
          <td><span class="badge ${esc(o.paymentStatus)}">${PAYMENT_HE[o.paymentStatus] || o.paymentStatus}</span></td>
          <td class="date">${formatDate(o.createdAt)}</td>
          <td class="total">${fmt(o.total)}</td>
        </tr>
      `).join('');

      body.querySelectorAll('tr.row').forEach(tr => {
        tr.addEventListener('click', () => openModal(tr.dataset.num));
      });
    } catch (e) {
      loading.style.display = 'none';
      empty.style.display = '';
      empty.textContent = 'שגיאה בטעינה: ' + e.message;
      toast('שגיאה בטעינת הזמנות', true);
    }
  }

  function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  // ============== Modal (Order Details) ==============
  async function openModal(orderNumber) {
    const modal = $('modal');
    modal.classList.add('open');
    $('m-order').textContent = orderNumber;
    $('m-body').innerHTML = '<div class="loading">טוען...</div>';

    try {
      const { order, items } = await window.api.get(`/api/admin/orders/${encodeURIComponent(orderNumber)}`);
      const addr = order.shippingAddress || {};

      $('m-body').innerHTML = `
        <div class="modal-section">
          <h3>פרטי לקוח</h3>
          <div class="kv">
            <div class="k">שם</div><div class="v">${esc(order.customerName)}</div>
            <div class="k">אימייל</div><div class="v"><a href="mailto:${esc(order.customerEmail)}">${esc(order.customerEmail)}</a></div>
            <div class="k">טלפון</div><div class="v"><a href="tel:${esc(order.customerPhone)}">${esc(order.customerPhone)}</a></div>
            <div class="k">כתובת</div><div class="v">${esc([addr.street, addr.city, addr.zip].filter(Boolean).join(', '))}</div>
            ${order.notes ? `<div class="k">הערות</div><div class="v" style="font-style:italic">${esc(order.notes)}</div>` : ''}
          </div>
        </div>

        <div class="modal-section">
          <h3>פריטים</h3>
          <div class="items-list">
            ${items.map(it => `
              <div class="row">
                <div>${esc(it.name)}${it.sku ? ` <span style="color:var(--text-light);font-size:12px">(${esc(it.sku)})</span>` : ''}</div>
                <div>${it.quantity} × ${fmt(it.unitPrice)}</div>
                <div style="font-weight:700">${fmt(it.lineTotal)}</div>
              </div>
            `).join('')}
            <div class="row totals">
              <div>סכום לפני מע"מ</div><div></div><div>${fmt(order.subtotal)}</div>
            </div>
            <div class="row totals">
              <div>מע"מ</div><div></div><div>${fmt(order.vat)}</div>
            </div>
            <div class="row totals">
              <div>משלוח</div><div></div><div>${order.shipping === 0 ? 'חינם' : fmt(order.shipping)}</div>
            </div>
            <div class="row totals" style="font-size:15px">
              <div>סה"כ</div><div></div><div>${fmt(order.total)}</div>
            </div>
          </div>
        </div>

        <div class="modal-section">
          <h3>סטטוס</h3>
          <div class="kv">
            <div class="k">סטטוס הזמנה</div><div class="v"><span class="badge ${esc(order.status)}">${STATUS_HE[order.status] || order.status}</span></div>
            <div class="k">סטטוס תשלום</div><div class="v"><span class="badge ${esc(order.paymentStatus)}">${PAYMENT_HE[order.paymentStatus] || order.paymentStatus}</span></div>
            <div class="k">תאריך הזמנה</div><div class="v">${formatDate(order.createdAt)}</div>
            ${order.paidAt ? `<div class="k">תאריך תשלום</div><div class="v">${formatDate(order.paidAt)}</div>` : ''}
            ${order.payplusTransactionUid ? `<div class="k">PayPlus UID</div><div class="v" style="font-family:monospace;font-size:12px">${esc(order.payplusTransactionUid)}</div>` : ''}
          </div>
          <div class="status-form">
            <select id="newStatus">
              ${Object.entries(STATUS_HE).map(([k, v]) =>
                `<option value="${k}" ${k === order.status ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
            <button class="btn-save" id="btnSaveStatus">שמור</button>
          </div>
        </div>`;

      $('btnSaveStatus').addEventListener('click', () => saveStatus(orderNumber));
    } catch (e) {
      $('m-body').innerHTML = `<div class="empty">שגיאה: ${esc(e.message)}</div>`;
    }
  }

  function closeModal() { $('modal').classList.remove('open'); }

  async function saveStatus(orderNumber) {
    const status = $('newStatus').value;
    const btn = $('btnSaveStatus');
    btn.disabled = true;
    btn.textContent = 'שומר...';
    try {
      // PATCH ידני (api.js שלנו תומך רק GET/POST)
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'שגיאת שרת');
      }
      toast('הסטטוס עודכן');
      closeModal();
      loadOrders();
      loadStats();
    } catch (e) {
      toast('שגיאה: ' + e.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = 'שמור';
    }
  }

  // ============== Toast ==============
  function toast(msg, isError = false) {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'toast show' + (isError ? ' error' : '');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  // ============== Init ==============
  document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadOrders();

    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        loadOrders();
      });
    });

    $('search').addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        currentSearch = e.target.value.trim();
        loadOrders();
      }, 350);
    });

    $('btnRefresh').addEventListener('click', () => { loadStats(); loadOrders(); });
    $('m-close').addEventListener('click', closeModal);
    $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  });
})();
