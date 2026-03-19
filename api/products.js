const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Create table if not exists
    await sql`
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
    `;

    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM products ORDER BY created_at DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { name, category, price, stock, description, image } = req.body;
      const id = Date.now().toString();
      
      await sql`
        INSERT INTO products (id, name, category, price, stock, description, image)
        VALUES (${id}, ${name}, ${category}, ${price}, ${stock}, ${description || ''}, ${image || '/images/placeholder.jpg'})
      `;
      
      const { rows } = await sql`SELECT * FROM products WHERE id = ${id}`;
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { name, category, price, stock, description, image } = req.body;
      
      await sql`
        UPDATE products 
        SET name = ${name}, category = ${category}, price = ${price}, 
            stock = ${stock}, description = ${description || ''}, image = ${image}
        WHERE id = ${id}
      `;
      
      const { rows } = await sql`SELECT * FROM products WHERE id = ${id}`;
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM products WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message });
  }
};
