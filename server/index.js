// ============================================
// שרת Express - קובץ הכניסה הראשי
// מפעיל את כל ה-middleware ואת ה-routes
// ============================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rateLimit from 'express-rate-limit';

import { config, usingPlaceholders } from './config.js';
import { checkSupabase } from './db/supabase.js';
import { checkEmailConfig } from './services/email.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import paymentsRouter from './routes/payments.js';
import adminRouter from './routes/admin.js';
import { adminAuth } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');

const app = express();

// --- Middleware ---
// helmet: הוספת headers של אבטחה (X-Frame-Options, CSP וכו')
// contentSecurityPolicy מבוטל כי ה-HTML משתמש ב-inline styles ו-fonts.googleapis.com
app.use(helmet({ contentSecurityPolicy: false }));

// CORS: בפיתוח - הכל. בפרודקשן - רק same-origin + railway.app + custom domains מ-ALLOWED_ORIGINS
const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    // בקשות ללא origin (curl, server-to-server, same-origin) - תמיד מותר
    if (!origin) return callback(null, true);
    // dev - הכל מותר
    if (!config.isProd) return callback(null, true);

    let hostname;
    try { hostname = new URL(origin).hostname; }
    catch { return callback(new Error('CORS: invalid origin'), false); }

    // PUBLIC_URL של הפרויקט - תמיד מותר
    try {
      if (hostname === new URL(config.publicUrl).hostname) return callback(null, true);
    } catch { /* ignore */ }

    // כל subdomain של railway.app (כולל PR preview deployments)
    if (/\.up\.railway\.app$/.test(hostname) || /\.railway\.app$/.test(hostname)) {
      return callback(null, true);
    }

    // localhost - לצורכי debugging מול שרת production
    if (/^localhost$|^127\.0\.0\.1$/.test(hostname)) return callback(null, true);

    // ALLOWED_ORIGINS (CSV) - דומיינים מותאמים אישית (למשל briner.co.il)
    const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (extra.some(o => o === origin || o === hostname)) return callback(null, true);

    callback(new Error(`CORS: origin not allowed: ${origin}`), false);
  },
};
app.use(cors(corsOptions));

// Body parsers: ממירים body של בקשות JSON ל-req.body
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Morgan: לוגים של כל בקשה לקונסול
app.use(morgan(config.isProd ? 'combined' : 'dev'));

// Rate limit על ה-API: לא יותר מ-100 בקשות לדקה מאותו IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// --- Routes ---

// Health check - לבדוק שהשרת חי ומחובר ל-Supabase + SMTP
app.get('/api/health', async (req, res) => {
  const [supabase, email] = await Promise.all([
    checkSupabase(),
    checkEmailConfig(),
  ]);
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    env: config.nodeEnv,
    placeholders: usingPlaceholders,
    supabase,
    email,
  });
});

// API נתיבים
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminAuth, adminRouter);

// --- פאנל ניהול (HTML+JS) - גם הוא מאחורי auth ---
app.use('/admin', adminAuth, express.static(path.join(publicDir, 'admin'), { extensions: ['html'] }));

// --- קבצים סטטיים (HTML/CSS/JS של הצד-לקוח) ---
app.use(express.static(publicDir, { extensions: ['html'] }));

// --- 404 handler ---
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'נתיב לא נמצא', path: req.path });
  }
  res.status(404).sendFile(path.join(publicDir, 'index.html'));
});

// --- Error handler ---
app.use((err, req, res, next) => {
  // ValidationError -> 400 עם field
  if (err.status === 400) {
    return res.status(400).json({ error: err.message, field: err.field });
  }
  console.error('[error]', err);
  res.status(err.status || 500).json({
    error: config.isProd ? 'שגיאת שרת' : err.message,
  });
});

// --- הפעלת השרת ---
app.listen(config.port, () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   🚀 Briner Shop server is running       ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`   ➜  Local:   ${config.publicUrl}`);
  console.log(`   ➜  Admin:   ${config.publicUrl}/admin  (user: ${config.admin.user})`);
  console.log(`   ➜  Env:     ${config.nodeEnv}`);
  console.log(`   ➜  Health:  ${config.publicUrl}/api/health\n`);

  const warnings = [];
  if (usingPlaceholders.supabase) warnings.push('Supabase');
  if (usingPlaceholders.payplus) warnings.push('PayPlus');
  if (usingPlaceholders.smtp) warnings.push('SMTP/Email');
  if (warnings.length) {
    console.log(`   ⚠  עובד עם placeholders ב: ${warnings.join(', ')}`);
    console.log('     עדכן את .env כשתקבל credentials אמיתיים\n');
  }
});
