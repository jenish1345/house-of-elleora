const { createToken, checkCredentials, JSON_HEADERS } = require('../lib/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  if (!checkCredentials(body.username, body.password)) {
    // Small delay slows down password guessing
    await new Promise(r => setTimeout(r, 800));
    return { statusCode: 401, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Invalid username or password' }) };
  }

  return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ token: createToken() }) };
};
