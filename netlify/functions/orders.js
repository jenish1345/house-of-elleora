const { Pool } = require('pg');
const { isAdmin, unauthorized, JSON_HEADERS } = require('../lib/auth');

// Database connection - set POSTGRES_URL in Netlify environment variables
const DB_URL = process.env.POSTGRES_URL;

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

  const pool = new Pool({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        pincode TEXT NOT NULL,
        landmark TEXT,
        items JSONB NOT NULL,
        subtotal DECIMAL(10,2),
        delivery_charges DECIMAL(10,2),
        total DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (event.httpMethod === 'GET') {
      const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');

      const formattedOrders = result.rows.map(row => ({
        orderId: row.order_id,
        customer: {
          name: row.customer_name,
          phone: row.customer_phone,
          email: row.customer_email
        },
        address: {
          line1: row.address_line1,
          line2: row.address_line2,
          city: row.city,
          state: row.state,
          pincode: row.pincode,
          landmark: row.landmark
        },
        items: row.items,
        subtotal: parseFloat(row.subtotal || 0),
        deliveryCharges: parseFloat(row.delivery_charges || 0),
        total: parseFloat(row.total),
        status: row.status,
        createdAt: row.created_at
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(formattedOrders)
      };
    }

    if (event.httpMethod === 'POST') {
      const { customer, address, items, subtotal, deliveryCharges, total } = body;
      const orderId = 'ORD' + Date.now();

      await pool.query(
        `INSERT INTO orders (
          order_id, customer_name, customer_phone, customer_email,
          address_line1, address_line2, city, state, pincode, landmark,
          items, subtotal, delivery_charges, total, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          orderId, customer.name, customer.phone, customer.email || null,
          address.line1, address.line2 || null, address.city, address.state,
          address.pincode, address.landmark || null,
          JSON.stringify(items), subtotal || total, deliveryCharges || 0, total, 'pending'
        ]
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, orderId })
      };
    }

    if (event.httpMethod === 'PUT') {
      const orderId = event.queryStringParameters?.orderId;
      if (!orderId || !ORDER_STATUSES.includes(body.status)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid order ID or status' }) };
      }
      const result = await pool.query('UPDATE orders SET status=$1 WHERE order_id=$2', [body.status, orderId]);
      if (result.rowCount === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Something went wrong. Please try again.' })
    };
  } finally {
    await pool.end();
  }
};
