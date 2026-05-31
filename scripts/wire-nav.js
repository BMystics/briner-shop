// Idempotent script: replace the <header>...</header> block in every content
// page with one unified header (logo + desktop nav dropdown + hamburger +
// mobile slide-down panel + action buttons), marking the current page active.
// Run after adding/renaming a page that uses the shared header.
// Usage: node scripts/wire-nav.js
import fs from 'node:fs';

const CATEGORY_PAGES = ['rubber', 'wax', 'heat', 'law', 'security', 'ink', 'dates', 'steel'];
const OTHER_PAGES = [{ file: 'about.html', activeSection: 'about' }];

const ITEMS = [
  ['/rubber',   'חותמות גומי'],
  ['/ink',      'דיו וכריות לדיו'],
  ['/dates',    'תאריכונים ומספרונים'],
  ['/heat',     'חותמות לסימון בחום'],
  ['/steel',    'מקבי פלדה להטבעה'],
  ['/wax',      'חותמות שעווה'],
  ['/law',      'חותמות נוטריוניות'],
  ['#',         'שבלונות שלטים ותגים'],
  ['#',         'סימון בטון / מזון'],
  ['/security', 'פלומבות לאבטחה'],
];

const DIRECT_LINKS = [
  { href: '/filaments', label: 'פילמנטים 3D', section: 'filaments' },
  { href: '/about',     label: 'אודות',      section: 'about' },
  { href: '/#contact',  label: 'יצירת קשר',  section: 'contact' },
];

// SVG icons reused across header (keep markup identical to homepage)
const SVG_CARET = '<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';
const SVG_PHONE = '<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.06 6.06l1.95-1.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
const SVG_WA = '<svg viewBox="0 0 24 24"><path d="M17.6 6.32A8.78 8.78 0 0 0 12.05 4 8.79 8.79 0 0 0 4.4 17.13L4 21l3.96-1.04A8.79 8.79 0 0 0 20.83 12a8.74 8.74 0 0 0-3.23-5.68z"/></svg>';

function buildHeader({ activeSlug = null, activeSection = null } = {}) {
  const dropdownActiveCls = activeSlug ? ' active' : '';
  const items = ITEMS
    .map(([href, label]) => {
      const a = activeSlug && href === '/' + activeSlug ? ' class="active"' : '';
      return `          <a href="${href}"${a}>${label}</a>`;
    })
    .join('\n');
  const directs = DIRECT_LINKS
    .map(({ href, label, section }) => {
      const a = section === activeSection ? ' active' : '';
      return `      <a href="${href}" class="nav-link${a}">${label}</a>`;
    })
    .join('\n');
  // Mobile panel: real category links (skip '#' placeholders) + direct links + CTA buttons
  const mobileCatLinks = ITEMS
    .filter(([href]) => href !== '#')
    .map(([href, label]) => {
      const a = activeSlug && href === '/' + activeSlug ? ' class="active"' : '';
      return `        <a href="${href}"${a}>${label}</a>`;
    })
    .join('\n');
  const mobileDirects = DIRECT_LINKS
    .map(({ href, label, section }) => {
      const a = section === activeSection ? ' class="active"' : '';
      return `        <a href="${href}"${a}>${label}</a>`;
    })
    .join('\n');

  return `<header>
  <div class="header-inner">
    <a href="/" class="logo">ברינר<em>·</em>חותמות</a>
    <nav>
      <div class="nav-item">
        <div class="nav-link${dropdownActiveCls}">חותמות ואביזרי סימון
          ${SVG_CARET}
        </div>
        <div class="dropdown">
${items}
        </div>
      </div>
${directs}
    </nav>
    <button class="hamburger" aria-label="פתיחת תפריט" aria-expanded="false"><span></span></button>
    <div class="header-actions">
      <a href="tel:03-5602991" class="action-btn">${SVG_PHONE}03-5602991</a>
      <a href="https://wa.me/972585833949" class="cta-btn" target="_blank" rel="noopener">${SVG_WA}WhatsApp</a>
    </div>
  </div>
  <div class="mobile-panel" id="mobilePanel">
    <div class="mobile-panel-inner">
      <div class="mobile-section-title">קטגוריות מוצרים</div>
${mobileCatLinks}
      <div class="mobile-section-title">כללי</div>
${mobileDirects}
      <div class="mobile-panel-cta">
        <a href="tel:03-5602991" class="mp-phone">03-5602991</a>
        <a href="https://wa.me/972585833949" class="mp-wa" target="_blank" rel="noopener">WhatsApp</a>
      </div>
    </div>
  </div>
</header>`;
}

function wire(filePath, headerHtml) {
  if (!fs.existsSync(filePath)) { console.log(`[skip] ${filePath} (not found)`); return false; }
  const before = fs.readFileSync(filePath, 'utf8');
  const after = before.replace(/<header>[\s\S]*?<\/header>/, headerHtml);
  if (after === before) { console.log(`[no-op] ${filePath}`); return false; }
  fs.writeFileSync(filePath, after, 'utf8');
  console.log(`[WIRED] ${filePath}`);
  return true;
}

let changed = 0;
for (const slug of CATEGORY_PAGES) {
  if (wire(`public/${slug}.html`, buildHeader({ activeSlug: slug }))) changed++;
}
for (const { file, activeSection } of OTHER_PAGES) {
  if (wire(`public/${file}`, buildHeader({ activeSection }))) changed++;
}
console.log(`\nPages updated: ${changed}`);
