const { isAdmin, unauthorized, JSON_HEADERS } = require('../lib/auth');
const { shopStore, readList, writeList } = require('../lib/store');

// Saved product list, used only if the store is empty or unreachable
const FALLBACK_PRODUCTS = require('./products-data.json');

const isImageUrl = (url) => typeof url === 'string' && (url.startsWith('https://') || url.startsWith('/api/image?key=') || url.startsWith('/images/'));

function validateProduct(p) {
  if (!p || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 200) return 'Invalid name';
  if (p.description != null && (typeof p.description !== 'string' || p.description.length > 5000)) return 'Invalid description';
  if (!(Number(p.price) >= 0) || Number(p.price) > 1000000) return 'Invalid price';
  if (!Number.isInteger(Number(p.stock)) || Number(p.stock) < 0) return 'Invalid stock';
  if (p.image != null && !isImageUrl(p.image)) return 'Invalid image URL';
  return null;
}

function cleanProduct(p, existing = {}) {
  return {
    ...existing,
    id: String(p.id || existing.id || Date.now()),
    name: p.name.trim(),
    description: p.description || '',
    price: Number(p.price),
    category: p.category || existing.category || '',
    stock: Number(p.stock),
    image: p.image || existing.image || null,
    created_at: existing.created_at || new Date().toISOString()
  };
}

exports.handler = async (event, context) => {
  const headers = { ...JSON_HEADERS, 'Cache-Control': 'no-cache' };
  const id = event.queryStringParameters?.id;

  // Only GET is public; adding, editing and deleting products is admin-only
  let body = {};
  if (event.httpMethod !== 'GET') {
    if (!isAdmin(event)) return unauthorized();
    if (!['POST', 'PUT', 'DELETE'].includes(event.httpMethod)) {
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
    if (event.httpMethod !== 'DELETE') {
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
      }
      const invalid = validateProduct(body);
      if (invalid) return { statusCode: 400, headers, body: JSON.stringify({ error: invalid }) };
    }
  }

  try {
    const store = shopStore(event);

    // ── GET ──────────────────────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      let products;
      try {
        products = await readList(store, 'products');
      } catch (storeError) {
        console.error('Store error on GET, using fallback:', storeError.message);
        products = [];
      }
      if (products.length === 0) products = FALLBACK_PRODUCTS;

      if (id) {
        return { statusCode: 200, headers, body: JSON.stringify(products.find(p => String(p.id) === id) || null) };
      }

      const visible = products
        .filter(p => isImageUrl(p.image))
        .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
      return { statusCode: 200, headers, body: JSON.stringify(visible) };
    }

    const products = await readList(store, 'products');

    // ── POST (add new product) ────────────────────────────────────────────
    if (event.httpMethod === 'POST') {
      const product = cleanProduct(body);
      if (products.some(p => String(p.id) === product.id)) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'Product ID already exists' }) };
      }
      products.push(product);
      await writeList(store, 'products', products);
      return { statusCode: 200, headers, body: JSON.stringify(product) };
    }

    // ── PUT (update / adjust stock) ───────────────────────────────────────
    if (event.httpMethod === 'PUT') {
      const targetId = String(body.id || id || '');
      const index = products.findIndex(p => String(p.id) === targetId);
      if (index === -1) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Product not found' }) };
      }
      products[index] = cleanProduct({ ...body, id: targetId }, products[index]);
      await writeList(store, 'products', products);
      return { statusCode: 200, headers, body: JSON.stringify(products[index]) };
    }

    // ── DELETE ────────────────────────────────────────────────────────────
    if (event.httpMethod === 'DELETE') {
      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Product ID is required' }) };
      }
      await writeList(store, 'products', products.filter(p => String(p.id) !== id));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Something went wrong. Please try again.' })
    };
  }
};
