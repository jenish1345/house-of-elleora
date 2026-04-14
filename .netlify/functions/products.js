const { Pool } = require('pg');

exports.handler = async (event, context) => {
  // Enable CORS
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
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category TEXT NOT NULL,
        stock INTEGER DEFAULT 0,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (event.httpMethod === 'GET') {
      // Get page parameter (default to 1)
      const page = parseInt(event.queryStringParameters?.page || '1');
      const limit = 20; // Load 20 products at a time
      const offset = (page - 1) * limit;
      
      const result = await pool.query(
        'SELECT id, name, description, price, category, stock, image, created_at FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      
      // Get total count
      const countResult = await pool.query('SELECT COUNT(*) FROM products');
      const total = parseInt(countResult.rows[0].count);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          products: result.rows,
          page: page,
          totalPages: Math.ceil(total / limit),
          total: total
        })
      };
    }

    if (event.httpMethod === 'POST') {
      const { name, description, price, category, stock, image } = JSON.parse(event.body);
      
      const result = await pool.query(
        'INSERT INTO products (name, description, price, category, stock, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, description, price, category, stock, image]
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    if (event.httpMethod === 'PUT') {
      const { id, name, description, price, category, stock, image } = JSON.parse(event.body);
      
      const result = await pool.query(
        'UPDATE products SET name=$1, description=$2, price=$3, category=$4, stock=$5, image=$6 WHERE id=$7 RETURNING *',
        [name, description, price, category, stock, image, id]
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters.id;
      await pool.query('DELETE FROM products WHERE id=$1', [id]);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await pool.end();
  }
};
