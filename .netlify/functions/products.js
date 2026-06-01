const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Fallback products data (embedded)
const FALLBACK_PRODUCTS = [
  {
    "id": "1773942848092",
    "name": "Korean clips black themed 🖤 ",
    "category": "Hair Clips",
    "price": 20,
    "stock": 20,
    "description": "Lost in the shadows where emotions speak louder than words 🖤\r\nDark aesthetics, deep feelings, and cinematic Korean vibes in every frame ✨",
    "image": "https://res.cloudinary.com/duqkjg5me/image/upload/v1780332526/house-of-elleora/product-1773942848092.jpg",
    "createdAt": "2026-03-19T17:54:08.092Z"
  }
];

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
      } else {
        // Fallback to products.json or embedded data if no database
        let products = FALLBACK_PRODUCTS;
        
        // Try to read from products.json if available
        try {
          const productsPath = path.join(__dirname, '../../products.json');
          if (fs.existsSync(productsPath)) {
            const data = fs.readFileSync(productsPath, 'utf8');
            products = JSON.parse(data);
            console.log('Loaded products from products.json');
          } else {
            console.log('Using fallback embedded products');
          }
        } catch (error) {
          console.error('Error reading products.json, using fallback:', error.message);
        }
        
        if (id) {
          const product = products.find(p => p.id === id);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(product || null)
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(products)
        };
      }
    }

    if (event.httpMethod === 'POST') {
      if (!hasDatabase) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({ error: 'Database not configured. Please set POSTGRES_URL environment variable.' })
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
          body: JSON.stringify({ error: 'Database not configured. Please set POSTGRES_URL environment variable.' })
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
          body: JSON.stringify({ error: 'Database not configured. Please set POSTGRES_URL environment variable.' })
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
    console.error('Database error:', error);
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
