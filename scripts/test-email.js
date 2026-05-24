// ============================================
// סקריפט בדיקת SMTP
// ============================================
// הרצה: node scripts/test-email.js [target-email]
// בלי פרמטר - שולח ל-EMAIL_ADMIN מ-.env
// ============================================
import 'dotenv/config';
import nodemailer from 'nodemailer';
import { config, usingPlaceholders } from '../server/config.js';
import { adminNewOrderEmail } from '../server/services/email-templates.js';

const target = process.argv[2] || config.smtp.admin;

if (usingPlaceholders.smtp) {
  console.error('\n✗ SMTP credentials are still placeholders. Update .env first.\n');
  process.exit(1);
}
if (!target) {
  console.error('\n✗ No target email. Usage: node scripts/test-email.js <email>\n');
  process.exit(1);
}

console.log('\n🔌 SMTP Connection');
console.log(`   Host:  ${config.smtp.host}:${config.smtp.port}`);
console.log(`   User:  ${config.smtp.user}`);
console.log(`   From:  ${config.smtp.from}`);
console.log(`   To:    ${target}\n`);

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: { user: config.smtp.user, pass: config.smtp.pass },
});

// ----- הכנת מייל בדיקה (משתמש בתבנית האמיתית) -----
const fakeOrder = {
  order_number: 'TEST-' + new Date().toISOString().slice(0, 16).replace(/[-:T]/g, ''),
  customer_name: 'בדיקת מערכת',
  customer_email: 'test-customer@example.com',
  customer_phone: '050-1234567',
  total: 207.00,
  subtotal: 175.42,
  tax: 31.58,
  shipping: 0,
  shipping_address: { street: 'הרצל 1', city: 'תל אביב', zip: '6100000' },
  notes: '⚠️ זהו מייל בדיקה אוטומטי. אם קיבלת אותו - SMTP עובד.',
  payment_status: 'paid',
};
const fakeItems = [
  { product_name: 'PLA - אדום', product_sku: 'PLA-RED', unit_price: 69, quantity: 2, line_total: 138 },
  { product_name: 'PLA - כחול', product_sku: 'PLA-BLU', unit_price: 69, quantity: 1, line_total: 69 },
];
const tpl = adminNewOrderEmail(fakeOrder, fakeItems);

try {
  console.log('⏳ Verifying SMTP credentials...');
  await transporter.verify();
  console.log('✓ Verified\n');

  console.log('📨 Sending test email...');
  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: target,
    subject: '[בדיקת מערכת] ' + tpl.subject,
    html: tpl.html,
  });

  console.log('\n✓ Email sent successfully!');
  console.log('   Message ID:', info.messageId);
  console.log('   Response:  ', info.response);
  console.log('   Accepted:  ', info.accepted);
  if (info.rejected?.length) console.log('   Rejected:  ', info.rejected);
  console.log('\n📬 Check the inbox of', target, '\n');
  process.exit(0);
} catch (err) {
  console.error('\n✗ FAILED:', err.message);
  if (err.code) console.error('   Code:', err.code);
  if (err.command) console.error('   Command:', err.command);
  if (err.response) console.error('   Server response:', err.response);
  if (err.responseCode) console.error('   Response code:', err.responseCode);
  console.error('');
  process.exit(1);
}
