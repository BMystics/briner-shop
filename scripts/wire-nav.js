// Idempotent script: replace the <nav> block in every content page with one
// unified menu (matching the homepage dropdown), marking the current page active.
// Run after adding/renaming a page that uses the shared header.
// Usage: node scripts/wire-nav.js
import fs from 'node:fs';

// Category pages that share the unified header nav.
const CATEGORY_PAGES = ['rubber', 'wax', 'heat', 'law', 'security', 'ink', 'dates', 'steel'];

// Non-catalog pages that also use the shared header.
// Each entry: { file, activeSection } — activeSection matches one of the direct-link sections below.
const OTHER_PAGES = [
  { file: 'about.html', activeSection: 'about' },
];

// Dropdown contents — same order/labels as the homepage "חותמות ואביזרי סימון" menu.
// '#' entries are known future categories (no page yet), kept for parity with homepage.
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

// Direct (non-dropdown) links shown after the products dropdown.
const DIRECT_LINKS = [
  { href: '/filaments',  label: 'פילמנטים 3D', section: 'filaments' },
  { href: '/about',      label: 'אודות',      section: 'about' },
  { href: '/#contact',   label: 'יצירת קשר',  section: 'contact' },
];

function buildNav({ activeSlug = null, activeSection = null } = {}) {
  // Dropdown toggle is "active" only when on a category page (you're inside the products menu).
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
  return `<nav>
      <div class="nav-item">
        <div class="nav-link${dropdownActiveCls}">חותמות ואביזרי סימון
          <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="dropdown">
${items}
        </div>
      </div>
${directs}
    </nav>`;
}

function wire(filePath, navHtml) {
  if (!fs.existsSync(filePath)) {
    console.log(`[skip] ${filePath} (not found)`);
    return false;
  }
  const before = fs.readFileSync(filePath, 'utf8');
  const after = before.replace(/<nav>[\s\S]*?<\/nav>/, navHtml);
  if (after === before) {
    console.log(`[no-op] ${filePath}`);
    return false;
  }
  fs.writeFileSync(filePath, after, 'utf8');
  console.log(`[WIRED] ${filePath}`);
  return true;
}

let changed = 0;
for (const slug of CATEGORY_PAGES) {
  if (wire(`public/${slug}.html`, buildNav({ activeSlug: slug }))) changed++;
}
for (const { file, activeSection } of OTHER_PAGES) {
  if (wire(`public/${file}`, buildNav({ activeSection }))) changed++;
}
console.log(`\nPages updated: ${changed}`);
