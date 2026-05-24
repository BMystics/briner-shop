// ============================================
// מודול עגלה משותף - localStorage + אירועים
// ============================================
// שימוש בדפים: window.cart.add(handle, qty, productSnapshot?)
// האזנה: window.addEventListener('cart:changed', () => ...);
// ============================================
(function () {
  const STORAGE_KEY = 'briner_cart_v1';
  let items = []; // [{handle, qty, name, price, img, type, badge}]

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) items = JSON.parse(raw);
      if (!Array.isArray(items)) items = [];
    } catch {
      items = [];
    }
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
    window.dispatchEvent(new CustomEvent('cart:changed', { detail: snapshot() }));
  }

  function find(handle) { return items.find(i => i.handle === handle); }

  function snapshot() {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * i.qty, 0);
    return { items: [...items], count, subtotal };
  }

  // ===== Public API =====
  const cart = {
    get items() { return [...items]; },
    get count() { return items.reduce((s, i) => s + i.qty, 0); },
    get subtotal() { return items.reduce((s, i) => s + (Number(i.price) || 0) * i.qty, 0); },

    add(handle, qty = 1, productSnapshot = null) {
      if (!handle || qty <= 0) return;
      const existing = find(handle);
      if (existing) {
        existing.qty += qty;
      } else {
        items.push({
          handle,
          qty,
          name: productSnapshot?.name || handle,
          price: Number(productSnapshot?.price) || 0,
          img: productSnapshot?.img || productSnapshot?.image_url || '',
          type: productSnapshot?.type || '',
          badge: productSnapshot?.badge || '',
        });
      }
      persist();
    },

    setQty(handle, qty) {
      const it = find(handle);
      if (!it) return;
      if (qty <= 0) {
        items = items.filter(i => i.handle !== handle);
      } else {
        it.qty = Math.min(99, Math.max(1, Math.floor(qty)));
      }
      persist();
    },

    changeQty(handle, delta) {
      const it = find(handle);
      if (!it) return;
      this.setQty(handle, it.qty + delta);
    },

    remove(handle) {
      items = items.filter(i => i.handle !== handle);
      persist();
    },

    clear() {
      items = [];
      persist();
    },
  };

  load();
  window.cart = cart;

  // אם דף נטען עם עגלה קיימת, נשגר אירוע אחרי DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    window.dispatchEvent(new CustomEvent('cart:changed', { detail: snapshot() }));
  });
})();
