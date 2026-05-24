// One-off script: wire homepage category cards/dropdown/footer to their pages.
// Run once per batch of new categories added.
import fs from 'node:fs';

const HTML_PATH = 'public/index.html';

// List of [hebrew label, new URL] - add new categories here as they're built.
const MAPPINGS = [
  ['חותמות גומי',         '/rubber'],
  ['חותמות לסימון בחום',   '/heat'],
  ['חותמות נוטריוניות',    '/law'],
  ['חותמות שעווה',         '/wax'],
];

let content = fs.readFileSync(HTML_PATH, 'utf8');
let total = 0;

// ---- Stage 1: process all CARDS from rightmost->leftmost ----
// This guarantees each card's "walk back to nearest <a href=#" works correctly
// regardless of MAPPINGS order, because we only edit positions BEFORE the next
// alt we'll process.
const cardJobs = [];
for (const [label, url] of MAPPINGS) {
  const altMarker = `alt="${label}"`;
  const altIdx = content.indexOf(altMarker);
  if (altIdx === -1) {
    console.log(`[card miss] no alt for ${label}`);
    continue;
  }
  cardJobs.push({ label, url, altIdx });
}
// Sort descending by altIdx (rightmost first)
cardJobs.sort((a, b) => b.altIdx - a.altIdx);

for (const { label, url, altIdx } of cardJobs) {
  const target = '<a href="#" class="cat-card">';
  const aIdx = content.lastIndexOf(target, altIdx);
  if (aIdx === -1) {
    console.log(`[card already linked] ${label}`);
    continue;
  }
  content = content.slice(0, aIdx) + `<a href="${url}" class="cat-card">` + content.slice(aIdx + target.length);
  console.log(`[CARD] ${label} -> ${url}`);
  total++;
}

// ---- Stage 2: dropdown + footer links (no position dependence) ----
for (const [label, url] of MAPPINGS) {

  const dropPattern = `<a href="#">${label}</a>`;
  if (content.includes(dropPattern)) {
    content = content.replace(dropPattern, `<a href="${url}">${label}</a>`);
    console.log(`[DROPDOWN] ${label}`);
    total++;
  }
  const footPattern = `<li><a href="#">${label}</a></li>`;
  if (content.includes(footPattern)) {
    content = content.replace(footPattern, `<li><a href="${url}">${label}</a></li>`);
    console.log(`[FOOTER] ${label}`);
    total++;
  }
}

fs.writeFileSync(HTML_PATH, content, 'utf8');
console.log(`\nTotal replacements: ${total}`);
