const crypto = require('crypto');

// Admin session tokens: "<expiry>.<hmac>", signed with ADMIN_TOKEN_SECRET.
// Set ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_TOKEN_SECRET in Netlify env vars.
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function sign(value) {
  const secret = process.env.ADMIN_TOKEN_SECRET;
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
  const [expires, mac] = token.split('.');
  if (!expires || !mac) return false;
  if (Number(expires) < Date.now()) return false;
  try {
    return safeEqual(mac, sign(expires));
  } catch {
    return false;
  }
}

function checkCredentials(username, password) {
  const u = process.env.ADMIN_USERNAME;
  const p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return false;
  const okUser = safeEqual(username || '', u);
  const okPass = safeEqual(password || '', p);
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
