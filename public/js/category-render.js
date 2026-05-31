// ============================================
// Shared catalog renderer
// Per-page JS sets window.CATEGORY_DATA = {hero:{title, desc, image, stats}, categories:[{id,name,desc,products}]}
// and we render it on DOMContentLoaded.
// ============================================
(function () {
  const WA_NUMBER = '972585833949';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  const waLink = (productName, model) => {
    const msg = `שלום, אני מעוניין במוצר "${productName}"${model ? ` (דגם ${model})` : ''}. אשמח להצעת מחיר.`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  function renderProduct(p) {
    return `<div class="prod-card">
      <div class="prod-img-wrap">
        <img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">
        ${p.model ? `<span class="prod-model-tag">${esc(p.model)}</span>` : ''}
      </div>
      <div class="prod-body">
        <div class="prod-name">${esc(p.name)}</div>
        ${p.size ? `<div class="prod-size"><svg viewBox="0 0 24 24"><path d="M3 3h18v18H3z M9 9v6 M15 9v6 M9 12h6"/></svg>${esc(p.size)}</div>` : ''}
        <div class="prod-desc">${esc(p.desc || '')}</div>
        <a href="${waLink(p.name, p.model)}" target="_blank" rel="noopener" class="btn-order">
          <svg viewBox="0 0 24 24"><path d="M17.6 6.32A8.78 8.78 0 0 0 12.05 4 8.79 8.79 0 0 0 4.4 17.13L4 21l3.96-1.04A8.79 8.79 0 0 0 20.83 12a8.74 8.74 0 0 0-3.23-5.68z"/></svg>
          להזמנה ב-WhatsApp
        </a>
      </div>
    </div>`;
  }

  function renderCategory(cat) {
    return `<section class="section-wrap" id="${esc(cat.id)}">
      <div class="section-head">
        <h2>${esc(cat.name)}</h2>
        <div class="count">${cat.products.length} ${cat.products.length === 1 ? 'דגם' : 'דגמים'}</div>
      </div>
      ${cat.desc ? `<p class="section-desc">${esc(cat.desc)}</p>` : ''}
      <div class="products-grid">${cat.products.map(renderProduct).join('')}</div>
    </section>`;
  }

  function renderHero(hero) {
    const stats = (hero.stats || []).map(s =>
      `<div class="stat-box"><div class="stat-num">${esc(s.num)}${s.unit?`<span>${esc(s.unit)}</span>`:''}</div><div class="stat-label">${esc(s.label)}</div></div>`
    ).join('');
    return `<div class="hero-accent"></div>
      <div class="hero-inner">
        <div class="hero-text">
          <h1>${hero.titleHTML || esc(hero.title)}</h1>
          <p>${esc(hero.desc)}</p>
          ${stats ? `<div class="hero-stats">${stats}</div>` : ''}
        </div>
        ${hero.image ? `<div class="hero-image"><img src="${esc(hero.image)}" alt="${esc(hero.title)}"></div>` : ''}
      </div>`;
  }

  function renderCategoryNav(categories) {
    return categories.map(c =>
      `<a href="#${esc(c.id)}" class="cat-link">${esc(c.name)}</a>`
    ).join('');
  }

  function render() {
    const catalogEl = $('catalog');
    if (!catalogEl) return; // not a catalog page (e.g. /about) — just init nav
    const D = window.CATEGORY_DATA;
    if (!D) { console.error('CATEGORY_DATA not set'); return; }
    const heroEl = $('hero');
    const catNavEl = $('catNav');
    if (heroEl && D.hero) heroEl.innerHTML = renderHero(D.hero);
    if (catNavEl && D.categories?.length > 1) catNavEl.innerHTML = renderCategoryNav(D.categories);
    else if (catNavEl) catNavEl.style.display = 'none';
    if (catalogEl) catalogEl.innerHTML = D.categories.map(renderCategory).join('');
  }

  // Header dropdown: hover works via CSS; this adds tap-to-open for touch devices
  // and closes the menu when clicking elsewhere.
  function initNav() {
    document.querySelectorAll('.nav-item > .nav-link').forEach((toggle) => {
      toggle.addEventListener('click', (e) => {
        const item = toggle.parentElement;
        const wasOpen = item.classList.contains('open');
        document.querySelectorAll('.nav-item.open').forEach((i) => i.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
        e.stopPropagation();
      });
    });
    document.addEventListener('click', () => {
      document.querySelectorAll('.nav-item.open').forEach((i) => i.classList.remove('open'));
    });

    // Mobile hamburger: toggles the slide-down panel.
    const burger = document.querySelector('.hamburger');
    const panel = document.querySelector('.mobile-panel');
    if (burger && panel) {
      burger.addEventListener('click', (e) => {
        e.stopPropagation();
        burger.classList.toggle('open');
        panel.classList.toggle('open');
      });
      // Close panel when tapping a link inside it
      panel.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => {
          burger.classList.remove('open');
          panel.classList.remove('open');
        });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => { render(); initNav(); });
})();
