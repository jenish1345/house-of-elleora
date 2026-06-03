const { Pool } = require('pg');

// All 115 products as fallback (used only if database is completely unreachable)
const FALLBACK_PRODUCTS = require('./products-data.json');

// Database connection - use env variable or fallback to hardcoded connection
const DB_URL = process.env.POSTGRES_URL || 'postgres://c0135a2403d9e2c9d6d193fb61c9735758a21ea8294c1981f649f4e7f551c6ed:sk_zOltAe07ew_IgXJNjPIME@db.prisma.io:5432/postgres?sslmode=require';

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await pool.end();
  }
};
