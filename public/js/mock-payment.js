// ============================================
// דף סליקה מדומה - לוגיקה
// ============================================
(function () {
  const $ = (id) => document.getElementById(id);

  async function load() {
    const orderNumber = new URLSearchParams(location.search).get('order');
    if (!orderNumber) return showError('לא צוין מספר הזמנה');

    try {
      const data = await window.api.get(`/api/orders/${encodeURIComponent(orderNumber)}`);
      render(data);
      bindActions(orderNumber);
    } catch (err) {
      showError(err.message || 'שגיאה בטעינת ההזמנה');
    }
  }

  function render({ order, items }) {
    $('loading').style.display = 'none';
    $('content').style.display = '';
    $('orderNum').textContent = order.orderNumber;
    $('customerName').textContent = order.customer.name;
    $('customerEmail').textContent = order.customer.email;
    $('itemCount').textContent = items.reduce((s, i) => s + i.quantity, 0) + ' יח׳';
    $('amount').textContent = Number(order.totals.total).toFixed(2).replace(/\.00$/, '');
  }

  function showError(msg) {
    $('loading').style.display = 'none';
    const err = $('error');
    err.style.display = '';
    err.textContent = msg;
  }

  function bindActions(orderNumber) {
    const approve = $('btnApprove');
    const decline = $('btnDecline');

    async function send(approved) {
      approve.disabled = decline.disabled = true;
      approve.textContent = 'מעבד...';
      try {
        await window.api.post('/api/payments/mock-callback', { orderNumber, approved });
        location.href = `/order-confirmation?order=${encodeURIComponent(orderNumber)}&payment=${approved ? 'success' : 'failure'}`;
      } catch (err) {
        showError(err.message || 'שגיאה בעדכון התשלום');
        approve.disabled = decline.disabled = false;
        approve.textContent = '✓ אשר תשלום';
      }
    }

    approve.addEventListener('click', () => send(true));
    decline.addEventListener('click', () => send(false));
  }

  document.addEventListener('DOMContentLoaded', load);
})();
