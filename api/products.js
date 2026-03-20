const { Pool } = require('pg');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        stock INTEGER NOT NULL,
        description TEXT,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { name, category, price, stock, description, image } = req.body;
      const id = Date.now().toString();
      
      const result = await pool.query(
        'INSERT INTO products (id, name, category, price, stock, description, image) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [id, name, category, price, stock, description || '', image || '/images/placeholder.jpg']
      );
      
      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { name, category, price, stock, description, image } = req.body;
      
      const result = await pool.query(
        'UPDATE products SET name = $1, category = $2, price = $3, stock = $4, description = $5, image = $6 WHERE id = $7 RETURNING *',
        [name, category, price, stock, description || '', image, id]
      );
      
      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await pool.query('DELETE FROM products WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
};
