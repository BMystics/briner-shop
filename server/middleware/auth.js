// ============================================
// HTTP Basic Auth ל-admin
// ============================================
// פשטות מקסימלית: הדפדפן מציג חלונית login native.
// אם הרצינו - להחליף ב-session-based עם cookies + bcrypt.
// ============================================
import crypto from 'node:crypto';
import { config } from '../config.js';

function timingSafeEqual(a, b) {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function adminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Basic ')) {
    let decoded;
    try {
      decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    } catch {
      return challenge(res);
    }
    const idx = decoded.indexOf(':');
    if (idx > 0) {
      const user = decoded.slice(0, idx);
      const pass = decoded.slice(idx + 1);
      if (timingSafeEqual(user, config.admin.user) &&
          timingSafeEqual(pass, config.admin.password)) {
        return next();
      }
    }
  }
  challenge(res);
}

function challenge(res) {
  res.set('WWW-Authenticate', 'Basic realm="Briner Admin"');
  res.status(401).send('דרושה הזדהות');
}
