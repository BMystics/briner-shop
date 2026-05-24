// ============================================
// שליחת מיילים - תומך ב-Resend (HTTP) או SMTP (nodemailer)
// ============================================
// סדר עדיפויות:
// 1. אם RESEND_API_KEY מוגדר - משתמשים ב-Resend (HTTP, עובד מאחורי firewalls)
// 2. אחרת אם SMTP credentials מוגדרים - משתמשים ב-nodemailer
// 3. אחרת - מצב mock (לוג בלבד)
// ============================================
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { config, usingPlaceholders, emailProvider } from '../config.js';
import { customerOrderPaidEmail, adminNewOrderEmail } from './email-templates.js';

let _transporter = null;
let _resend = null;

function getTransporter() {
  if (_transporter) return _transporter;
  if (emailProvider !== 'smtp') return null;
  _transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
  return _transporter;
}

function getResend() {
  if (_resend) return _resend;
  if (emailProvider !== 'resend') return null;
  _resend = new Resend(config.resend.apiKey);
  return _resend;
}

async function sendMail({ to, subject, html, replyTo }) {
  if (!emailProvider) {
    // mock mode - log only
    console.log('\n📧 [mock email] ───────────────────────');
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Reply:   ${replyTo || '(none)'}`);
    console.log(`   (הגדר RESEND_API_KEY או SMTP_* ב-.env כדי לשלוח באמת)`);
    console.log('───────────────────────────────────────\n');
    return { mock: true };
  }

  if (emailProvider === 'resend') {
    const r = getResend();
    const res = await r.emails.send({
      from: config.smtp.from,
      to,
      subject,
      html,
      replyTo: replyTo ? [replyTo] : undefined,
    });
    if (res.error) throw new Error(`Resend: ${res.error.message || JSON.stringify(res.error)}`);
    return { mock: false, messageId: res.data?.id, provider: 'resend' };
  }

  // SMTP
  const tx = getTransporter();
  const info = await tx.sendMail({
    from: config.smtp.from,
    to,
    subject,
    html,
    replyTo,
  });
  return { mock: false, messageId: info.messageId, provider: 'smtp' };
}

// ============== Public API ==============

/**
 * שולח שני מיילים אחרי תשלום מוצלח:
 * 1. אישור ללקוח
 * 2. התראה למנהל (אם הוגדר EMAIL_ADMIN)
 */
export async function sendOrderPaidEmails(order, items) {
  const errors = [];

  try {
    const customerMail = customerOrderPaidEmail(order, items);
    await sendMail({
      to: order.customer_email,
      subject: customerMail.subject,
      html: customerMail.html,
      replyTo: config.smtp.admin || undefined,
    });
  } catch (e) {
    console.error('[email] customer email failed:', e.message);
    errors.push({ type: 'customer', error: e.message });
  }

  if (config.smtp.admin) {
    try {
      const adminMail = adminNewOrderEmail(order, items);
      await sendMail({
        to: config.smtp.admin,
        subject: adminMail.subject,
        html: adminMail.html,
        replyTo: order.customer_email,
      });
    } catch (e) {
      console.error('[email] admin email failed:', e.message);
      errors.push({ type: 'admin', error: e.message });
    }
  }

  return { ok: errors.length === 0, errors };
}

// Helper לבדיקה ב-/api/health
export async function checkEmailConfig() {
  if (!emailProvider) return { ready: false, mode: 'mock' };
  if (emailProvider === 'resend') {
    // ל-Resend אין endpoint רשמי ל-verify. נניח שהמפתח קיים = ready.
    // אם המפתח שגוי, נראה את זה רק בניסיון שליחה הראשון.
    return { ready: true, mode: 'resend' };
  }
  // SMTP - verify עם timeout
  try {
    const tx = getTransporter();
    await Promise.race([
      tx.verify(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('verify timeout 15s')), 15000)),
    ]);
    return { ready: true, mode: 'smtp' };
  } catch (e) {
    return { ready: false, mode: 'smtp', error: e.message };
  }
}
