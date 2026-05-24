// ============================================
// סקריפט בדיקת חיבור Supabase + מצב סכמה
// ============================================
// הרצה: node scripts/check-supabase.js
// ============================================
import 'dotenv/config';
import { config, usingPlaceholders } from '../server/config.js';
import { getSupabase } from '../server/db/supabase.js';

function maskUrl(url) {
  if (!url) return '(none)';
  try {
    const u = new URL(url);
    return u.protocol + '//' + u.hostname;
  } catch { return '(invalid)'; }
}

console.log('\n📋 .env Status');
console.log('   URL:         ', maskUrl(config.supabase.url));
console.log('   ANON key:    ', config.supabase.anonKey && !config.supabase.anonKey.includes('placeholder') ? `set (${config.supabase.anonKey.length} chars)` : '✗ placeholder');
console.log('   SERVICE key: ', config.supabase.serviceKey && !config.supabase.serviceKey.includes('placeholder') ? `set (${config.supabase.serviceKey.length} chars)` : '✗ placeholder');
console.log('   Mode:        ', usingPlaceholders.supabase ? '⚠ PLACEHOLDER (mock mode)' : '✓ REAL');

if (usingPlaceholders.supabase) {
  console.log('\n✗ .env still has placeholders. Update SUPABASE_URL/ANON/SERVICE keys.');
  process.exit(1);
}

const sb = getSupabase();

console.log('\n🔌 Testing connection (auth)...');
// Test 1: simple ping using rpc that always exists
try {
  // We'll just try to list tables via a guaranteed query
  const { error } = await sb.from('_no_such_table_').select('*').limit(1);
  if (error && error.code === 'PGRST205') {
    // PGRST205 = relation not found - means auth works
    console.log('   ✓ Auth OK (server replied to query)');
  } else if (error) {
    console.log('   Got error:', error.code, error.message);
    if (error.message?.toLowerCase().includes('invalid') || error.code === 401) {
      console.log('\n✗ Authentication failed - check SERVICE_KEY in .env');
      process.exit(1);
    }
  } else {
    console.log('   ✓ Auth OK');
  }
} catch (e) {
  console.log('   ✗ Network/auth error:', e.message);
  process.exit(1);
}

console.log('\n🔍 Checking required tables...');
const tables = ['products', 'customers', 'orders', 'order_items'];
const results = {};
let allExist = true;
for (const t of tables) {
  // ננסה לקרוא רשומה (לא head:true - לא תופס PGRST205 בכל המקרים)
  const { data, error } = await sb.from(t).select('*').limit(1);
  if (error) {
    results[t] = { exists: false, error: error.message };
    allExist = false;
  } else {
    // אם הצליח, נשלוף count ב-second call
    const { count } = await sb.from(t).select('*', { count: 'exact', head: true });
    results[t] = { exists: true, rows: count ?? 0 };
  }
}
for (const [t, r] of Object.entries(results)) {
  if (r.exists) console.log(`   ✓ ${t.padEnd(13)} (${r.rows} rows)`);
  else console.log(`   ✗ ${t.padEnd(13)} - ${r.error}`);
}

console.log();
if (allExist) {
  console.log('✓ All tables exist. Schema is applied.');
  if (results.products.rows === 0) {
    console.log('  ⚠ products table is empty - run seed.sql to populate.');
  }
  process.exit(0);
} else {
  console.log('⚠ Some tables missing. Run schema.sql in Supabase SQL Editor.');
  process.exit(2);
}
