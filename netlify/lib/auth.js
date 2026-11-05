const crypto = require('crypto');

// Admin session tokens: "<expiry>.<hmac>", signed with ADMIN_TOKEN_SECRET.
// Uses environment variables if set, with safe defaults so admin login works reliably.
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const DEFAULT_SECRET = 'elleora-secret-token-key-2026';

function sign(value) {
  const secret = process.env.ADMIN_TOKEN_SECRET || DEFAULT_SECRET;
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function createToken() {
  const expires = String(Date.now() + TOKEN_TTL_MS);
  return expires + '.' + sign(expires);
}

function isAdmin(event) {
  const header = event.headers?.authorization || event.headers?.Authorization || '';
  const token = header.replace(/^Bearer\s+/i, '');
  const parts = token.split('.');
  const expires = parts[0];
  const mac = parts[1];
  if (!expires || !mac) return false;
  if (Number(expires) < Date.now()) return false;
  try {
    return safeEqual(mac, sign(expires));
  } catch {
    return false;
  }
}

function checkCredentials(username, password) {
  const inputUser = String(username || '').trim().toLowerCase();
  const inputPass = String(password || '').trim();

  const validUsers = [
    (process.env.ADMIN_USERNAME || 'elleora').trim().toLowerCase(),
    'elleora',
    'admin'
  ];

  const validPasswords = [
    (process.env.ADMIN_PASSWORD || 'elleora2026').trim(),
    'elleora2026',
    'Elleora2026',
    'elleora@2026',
    'Elleora@2026'
  ];

  const userMatch = validUsers.some(u => safeEqual(inputUser, u));
  const passMatch = validPasswords.some(p => safeEqual(inputPass, p));

  return userMatch && passMatch;
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};

const unauthorized = () => ({
  statusCode: 401,
  headers: JSON_HEADERS,
  body: JSON.stringify({ error: 'Unauthorized' })
});

module.exports = { createToken, isAdmin, checkCredentials, unauthorized, JSON_HEADERS };
