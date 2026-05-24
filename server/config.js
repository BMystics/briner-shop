// ============================================
// טעינת והגדרת משתני סביבה
// קובץ זה קורא את .env פעם אחת ומחשב גם flags שימושיים
// ============================================
import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.warn(`[config] חסר משתנה סביבה: ${name} - שירותים שתלויים בו לא יעבדו`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
  isProd: process.env.NODE_ENV === 'production',

  supabase: {
    url: required('SUPABASE_URL'),
    anonKey: required('SUPABASE_ANON_KEY'),
    serviceKey: required('SUPABASE_SERVICE_KEY'),
  },

  payplus: {
    apiUrl: process.env.PAYPLUS_API_URL,
    apiKey: required('PAYPLUS_API_KEY'),
    secretKey: required('PAYPLUS_SECRET_KEY'),
    paymentPageUid: required('PAYPLUS_PAYMENT_PAGE_UID'),
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'no-reply@briner.co.il',
    admin: process.env.EMAIL_ADMIN,
  },

  // Resend (HTTP API) - חלופה ל-SMTP, עובד גם מאחורי firewalls שחוסמים SMTP
  // אם RESEND_API_KEY מוגדר, נשתמש בו במקום nodemailer
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },

  admin: {
    user: process.env.ADMIN_USER || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin',
    sessionSecret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
  },

  commerce: {
    vatRate: Number(process.env.VAT_RATE) || 0.18,
    shippingFlatRate: Number(process.env.SHIPPING_FLAT_RATE) || 30,
    freeShippingThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD) || 200,
  },
};

// בדיקה אם credentials הם placeholders (כדי לדעת אם להריץ ב-mock mode)
// בודק אם יש איזשהו ספק מייל מוגדר (Resend או SMTP אמיתי, לא placeholders)
const hasResend = !!config.resend.apiKey && !config.resend.apiKey.includes('placeholder');
const hasSmtp = !!config.smtp.user && !config.smtp.user.includes('placeholder');

export const usingPlaceholders = {
  supabase: !config.supabase.url || config.supabase.url.includes('placeholder'),
  payplus: !config.payplus.apiKey || config.payplus.apiKey.includes('placeholder'),
  smtp: !hasResend && !hasSmtp,  // אין מייל אם אין אף אחד מהשניים
};

// איזה ספק מייל בשימוש: 'resend' / 'smtp' / null (mock)
export const emailProvider = hasResend ? 'resend' : (hasSmtp ? 'smtp' : null);
