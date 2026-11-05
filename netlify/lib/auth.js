const crypto = require('crypto');

// Admin session tokens: "<expiry>.<hmac>", signed with ADMIN_TOKEN_SECRET.
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function getEnv(key) {
  return process.env[key.toUpperCase()] || process.env[key.toLowerCase()] || '';
}

function sign(value) {
  const secret = getEnv('admin_token_secret');
  if (!secret) throw new Error('ADMIN_TOKEN_SECRET not set');
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
  const u = getEnv('admin_username');
  const p = getEnv('admin_password');
  if (!u || !p) return false;
  const okUser = safeEqual(String(username || '').trim().toLowerCase(), String(u).trim().toLowerCase());
  const okPass = safeEqual(String(password || '').trim(), String(p).trim());
  return okUser && okPass;
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
