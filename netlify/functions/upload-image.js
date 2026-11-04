const { isAdmin, unauthorized, JSON_HEADERS } = require('../lib/auth');
const { imageStore } = require('../lib/store');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 4 * 1024 * 1024;

exports.handler = async (event, context) => {
  const headers = JSON_HEADERS;

  if (!isAdmin(event)) return unauthorized();

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { image, productId } = JSON.parse(event.body || '{}');
    const match = typeof image === 'string' && image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (!match || !ALLOWED_TYPES.includes(match[1])) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Only JPG, PNG, WebP or GIF images are allowed' }) };
    }

    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length > MAX_BYTES) {
      return { statusCode: 413, headers, body: JSON.stringify({ error: 'Image is too large (max 4 MB)' }) };
    }

    // Unique key per upload so browsers never show an old cached photo
    const safeId = String(productId || 'new').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
    const key = `product-${safeId}-${Date.now()}`;
    await imageStore(event).set(key, bytes, { metadata: { contentType: match[1] } });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, url: `/api/image?key=${key}` })
    };
  } catch (error) {
    console.error('Image upload error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to upload image' }) };
  }
};
