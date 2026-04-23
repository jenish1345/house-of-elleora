const { Pool } = require('pg');

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
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    if (event.httpMethod === 'GET') {
      const id = event.queryStringParameters?.id;
      
      // If requesting a single product, return it
      if (id) {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows[0] || null)
        };
      }
      
      // Return only products with Cloudinary images (exclude base64)
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
