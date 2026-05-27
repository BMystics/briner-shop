// Idempotent script: replace the <nav> block in every category page with one
// unified menu (matching the homepage dropdown), marking the current page active.
// Run after adding/renaming a category page. Usage: node scripts/wire-nav.js
import fs from 'node:fs';

// Category pages that share the unified header nav.
const PAGES = ['rubber', 'wax', 'heat', 'law', 'security', 'ink', 'dates', 'steel'];

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

function buildNav(slug) {
  const active = '/' + slug;
  const items = ITEMS
    .map(([href, label]) => `          <a href="${href}"${href === active ? ' class="active"' : ''}>${label}</a>`)
    .join('\n');
  return `<nav>
      <div class="nav-item">
        <div class="nav-link active">חותמות ואביזרי סימון
          <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="dropdown">
${items}
        </div>
      </div>
      <a href="/filaments" class="nav-link">פילמנטים 3D</a>
      <a href="/#about" class="nav-link">אודות</a>
      <a href="/#contact" class="nav-link">יצירת קשר</a>
    </nav>`;
}

let changed = 0;
for (const slug of PAGES) {
  const path = `public/${slug}.html`;
  const before = fs.readFileSync(path, 'utf8');
  const after = before.replace(/<nav>[\s\S]*?<\/nav>/, buildNav(slug));
  if (after === before) {
    console.log(`[no-op] ${slug}.html (already current or no <nav> found)`);
    continue;
  }
  fs.writeFileSync(path, after, 'utf8');
  console.log(`[WIRED] ${slug}.html`);
  changed++;
}
console.log(`\nPages updated: ${changed}/${PAGES.length}`);
