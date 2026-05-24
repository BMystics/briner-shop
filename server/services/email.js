// ============================================
// שליחת מיילים דרך SMTP (nodemailer)
// ============================================
// במצב mock (אין SMTP credentials) - הודעות נדפסות לקונסול במקום להישלח.
// כך אפשר לבדוק את כל הזרימה בלי לחבר Gmail/SendGrid.
// ============================================
import nodemailer from 'nodemailer';
import { config, usingPlaceholders } from '../config.js';
import { customerOrderPaidEmail, adminNewOrderEmail } from './email-templates.js';

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  if (usingPlaceholders.smtp) return null;
  _transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
  return _transporter;
}

async function sendMail({ to, subject, html, replyTo }) {
  if (usingPlaceholders.smtp) {
    // mock mode - log only
    console.log('\n📧 [mock email] ───────────────────────');
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Reply:   ${replyTo || '(none)'}`);
    console.log(`   (הגדר SMTP credentials ב-.env כדי לשלוח באמת)`);
    console.log('───────────────────────────────────────\n');
    return { mock: true };
  }
  const tx = getTransporter();
  const info = await tx.sendMail({
    from: config.smtp.from,
    to,
    subject,
    html,
    replyTo,
  });
  return { mock: false, messageId: info.messageId };
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
// חשוב: verify() עושה חיבור TCP אמיתי. אם פורט חסום (כמו 587 ב-Railway)
// הוא יחכה דקה+. לכן אנחנו עוטפים ב-timeout של 4 שניות.
export async function checkEmailConfig() {
  if (usingPlaceholders.smtp) return { ready: false, mode: 'mock' };
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
