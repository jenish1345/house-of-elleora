const { Pool } = require('pg');

// All 115 products embedded directly (loaded from database)
const FALLBACK_PRODUCTS = require('./products-data.json');

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

  // Check if database is configured
  const hasDatabase = !!process.env.POSTGRES_URL;
  
  let pool;
  if (hasDatabase) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false }
    });
  }

  try {
    if (event.httpMethod === 'GET') {
      const id = event.queryStringParameters?.id;
      
      if (hasDatabase) {
        // Use database if available
        try {
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
        } catch (dbError) {
          console.error('Database error, falling back to static data:', dbError.message);
          // Fall through to fallback data
        }
      }
      
      // Fallback to embedded products data
      console.log(`Using fallback products data: ${FALLBACK_PRODUCTS.length} products`);
      
      if (id) {
        const product = FALLBACK_PRODUCTS.find(p => p.id === id);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(product || null)
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(FALLBACK_PRODUCTS)
      };
    }

    if (event.httpMethod === 'POST') {
      if (!hasDatabase) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({ error: 'Database not configured. Please set POSTGRES_URL environment variable to add products.' })
        };
      }
      
      const { id, name, description, price, category, stock, image } = JSON.parse(event.body);
      
      // Generate ID if not provided
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

    if (event.httpMethod === 'PUT') {
      if (!hasDatabase) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({ error: 'Database not configured. Please set POSTGRES_URL environment variable to update products.' })
        };
      }
      
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
      if (!hasDatabase) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({ error: 'Database not configured. Please set POSTGRES_URL environment variable to delete products.' })
        };
      }
      
      const id = event.queryStringParameters.id;
      await pool.query('DELETE FROM products WHERE id=$1', [id]);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};
