const { Pool } = require('pg');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
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

    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      
      // Format orders to match frontend structure
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
      
      return res.status(200).json(formattedOrders);
    }

    if (req.method === 'POST') {
      const { customer, address, items, subtotal, deliveryCharges, total } = req.body;
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
      
      return res.status(200).json({ success: true, orderId });
    }

    if (req.method === 'PUT') {
      const { orderId } = req.query;
      const { status } = req.body;
      
      await pool.query('UPDATE orders SET status = $1 WHERE order_id = $2', [status, orderId]);
      
      const result = await pool.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
      return res.status(200).json(result.rows[0]);
    }

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
};
