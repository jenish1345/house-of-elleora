const { Pool } = require('pg');
const { isAdmin, unauthorized, JSON_HEADERS } = require('../lib/auth');

// All 115 products as fallback (used only if database is completely unreachable)
const FALLBACK_PRODUCTS = require('./products-data.json');

// Database connection - set POSTGRES_URL in Netlify environment variables
const DB_URL = process.env.POSTGRES_URL;

function validateProduct(p) {
  if (!p || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 200) return 'Invalid name';
  if (p.description != null && (typeof p.description !== 'string' || p.description.length > 5000)) return 'Invalid description';
  if (!(Number(p.price) >= 0) || Number(p.price) > 1000000) return 'Invalid price';
  if (!Number.isInteger(Number(p.stock)) || Number(p.stock) < 0) return 'Invalid stock';
  if (p.image != null && (typeof p.image !== 'string' || !p.image.startsWith('https://'))) return 'Invalid image URL';
  return null;
}

exports.handler = async (event, context) => {
  const headers = { ...JSON_HEADERS, 'Cache-Control': 'public, max-age=60' };

  // Only GET is public; adding, editing and deleting products is admin-only
  if (event.httpMethod !== 'GET') {
    if (!isAdmin(event)) return unauthorized();
    if (!['POST', 'PUT', 'DELETE'].includes(event.httpMethod)) {
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
    if (event.httpMethod !== 'DELETE') {
      let parsed;
      try {
        parsed = JSON.parse(event.body || '{}');
      } catch {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
      }
      const invalid = validateProduct(parsed);
      if (invalid) return { statusCode: 400, headers, body: JSON.stringify({ error: invalid }) };
    }
  }

  const pool = new Pool({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // ── GET ──────────────────────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      const id = event.queryStringParameters?.id;

      try {
        if (id) {
          const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result.rows[0] || null)
          };
        }

        const result = await pool.query(`
          SELECT id, name, description, price, category, stock, image, created_at
          FROM products
          WHERE image LIKE 'https://res.cloudinary.com%'
          ORDER BY created_at DESC
        `);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };
      } catch (dbError) {
        // Database unreachable – serve static fallback so site still works
        console.error('DB error on GET, using fallback:', dbError.message);
        if (id) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(FALLBACK_PRODUCTS.find(p => p.id === id) || null)
          };
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(FALLBACK_PRODUCTS)
        };
      }
    }

    // ── POST (add new product) ────────────────────────────────────────────
    if (event.httpMethod === 'POST') {
      const { id, name, description, price, category, stock, image } = JSON.parse(event.body);
      const productId = id || Date.now().toString();

      const result = await pool.query(
        'INSERT INTO products (id, name, description, price, category, stock, image) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [productId, name, description, price, category, stock, image]
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // ── PUT (update / adjust stock) ───────────────────────────────────────
    if (event.httpMethod === 'PUT') {
      const { id, name, description, price, category, stock, image } = JSON.parse(event.body);

      const result = await pool.query(
        'UPDATE products SET name=$1, description=$2, price=$3, category=$4, stock=$5, image=$6 WHERE id=$7 RETURNING *',
        [name, description, price, category, stock, image, id]
      );

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Product not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // ── DELETE ────────────────────────────────────────────────────────────
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Product ID is required' })
        };
      }

      await pool.query('DELETE FROM products WHERE id=$1', [id]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Something went wrong. Please try again.' })
    };
  } finally {
    await pool.end();
  }
};
