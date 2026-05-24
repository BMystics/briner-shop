// ============================================
// יצירת Supabase Client
// ============================================
// אנחנו משתמשים ב-SERVICE_ROLE key (לא anon) כי השרת
// מבצע פעולות מטעם המערכת ועוקף Row Level Security.
// לעולם אל תחשוף את service_role key בצד הלקוח!
// ============================================
import { createClient } from '@supabase/supabase-js';
import { config, usingPlaceholders } from '../config.js';

let _client = null;

export function getSupabase() {
  if (_client) return _client;
  if (usingPlaceholders.supabase) {
    // ב-mock mode מחזירים null - ה-routes יודעים לטפל בזה
    return null;
  }
  _client = createClient(config.supabase.url, config.supabase.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

// Helper לבדיקה מהירה אם החיבור עובד (משמש ב-/api/health)
export async function checkSupabase() {
  const sb = getSupabase();
  if (!sb) return { connected: false, reason: 'placeholder credentials' };
  try {
    const { error } = await sb.from('products').select('id').limit(1);
    if (error) return { connected: false, reason: error.message };
    return { connected: true };
  } catch (e) {
    return { connected: false, reason: e.message };
  }
}
