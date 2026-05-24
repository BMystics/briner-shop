// ============================================
// סקריפט seed - מכניס מוצרים לטבלת products ב-Supabase
// ============================================
// הרצה: node scripts/seed-supabase.js
// idempotent: אפשר להריץ שוב ושוב, upsert לפי handle.
// ============================================
import 'dotenv/config';
import { mockProducts } from '../server/db/mock-data.js';
import { getSupabase } from '../server/db/supabase.js';
import { usingPlaceholders } from '../server/config.js';

if (usingPlaceholders.supabase) {
  console.error('\n✗ Supabase still in placeholder mode. Update .env first.\n');
  process.exit(1);
}

// מסירים id (יגיע מ-DEFAULT uuid), שאר השדות תואמים את הסכמה
const rows = mockProducts.map(({ id, ...rest }) => rest);

console.log(`\n🌱 Seeding ${rows.length} products into Supabase...`);

const sb = getSupabase();

const { data, error } = await sb
  .from('products')
  .upsert(rows, { onConflict: 'handle', ignoreDuplicates: false })
  .select('handle, name');

if (error) {
  console.error('\n✗ Seed failed:', error.message);
  if (error.details) console.error('  Details:', error.details);
  if (error.hint) console.error('  Hint:', error.hint);
  process.exit(1);
}

console.log(`✓ Inserted/updated ${data.length} products:\n`);
data.forEach((p, i) => {
  console.log(`   ${String(i + 1).padStart(2)}. ${p.handle.padEnd(28)} ${p.name}`);
});

console.log(`\n✓ Done. Verify at https://supabase.com/dashboard/project/_/editor\n`);
