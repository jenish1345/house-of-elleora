const { isAdmin, unauthorized, JSON_HEADERS } = require('../lib/auth');
const { shopStore, readList, writeList } = require('../lib/store');

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const str = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const optStr = (v, max) => v == null || v === '' || (typeof v === 'string' && v.length <= max);

function validateOrder(o) {
  const { customer, address, items, total } = o || {};
  if (!customer || !address) return 'Missing customer or address';
  if (!str(customer.name, 100)) return 'Invalid name';
  if (typeof customer.phone !== 'string' || !/^\+?[0-9 ]{10,15}$/.test(customer.phone)) return 'Invalid phone';
  if (!optStr(customer.email, 200) || (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))) return 'Invalid email';
  if (!str(address.line1, 200) || !optStr(address.line2, 200) || !optStr(address.landmark, 200)) return 'Invalid address';
  if (!str(address.city, 100) || !str(address.state, 100)) return 'Invalid city/state';
  if (typeof address.pincode !== 'string' || !/^[0-9]{6}$/.test(address.pincode)) return 'Invalid pincode';
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) return 'Invalid items';
  if (typeof total !== 'number' || !(total > 0) || total > 1000000) return 'Invalid total';
  return null;
}

exports.handler = async (event, context) => {
  const headers = JSON_HEADERS;

  // Reading or changing orders is admin-only; customers may only place an order
  if (event.httpMethod !== 'POST' && !isAdmin(event)) {
    return unauthorized();
  }

  if (!['GET', 'POST', 'PUT'].includes(event.httpMethod)) {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body = {};
  if (event.httpMethod !== 'GET') {
    if ((event.body || '').length > 50000) {
      return { statusCode: 413, headers, body: JSON.stringify({ error: 'Request too large' }) };
    }
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }
  }

  if (event.httpMethod === 'POST') {
    // Honeypot: real customers never fill the hidden "website" field
    if (body.website) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }
    const invalid = validateOrder(body);
    if (invalid) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: invalid }) };
    }
  }

  try {
    const store = shopStore(event);
    const orders = await readList(store, 'orders');

    if (event.httpMethod === 'GET') {
      const sorted = [...orders].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      return { statusCode: 200, headers, body: JSON.stringify(sorted) };
    }

    if (event.httpMethod === 'POST') {
      const { customer, address, items, subtotal, deliveryCharges, total } = body;
      const orderId = 'ORD' + Date.now();
      orders.push({
        orderId,
        customer: { name: customer.name, phone: customer.phone, email: customer.email || null },
        address: {
          line1: address.line1, line2: address.line2 || null, city: address.city,
          state: address.state, pincode: address.pincode, landmark: address.landmark || null
        },
        items,
        subtotal: Number(subtotal || total),
        deliveryCharges: Number(deliveryCharges || 0),
        total,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      await writeList(store, 'orders', orders);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, orderId }) };
    }

    if (event.httpMethod === 'PUT') {
      const orderId = event.queryStringParameters?.orderId;
      if (!orderId || !ORDER_STATUSES.includes(body.status)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid order ID or status' }) };
      }
      const order = orders.find(o => o.orderId === orderId);
      if (!order) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) };
      }
      order.status = body.status;
      await writeList(store, 'orders', orders);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

  } catch (error) {
    console.error('Store error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Something went wrong. Please try again.' })
    };
  }
};
