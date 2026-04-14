const { Pool } = require('pg');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT',
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
      const { customer, address, items, subtotal, deliveryCharges, total } = JSON.parse(event.body);
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
