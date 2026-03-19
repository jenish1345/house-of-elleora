import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Create table if not exists
    await sql`
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
    `;

    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
      
      // Format orders to match frontend structure
      const formattedOrders = rows.map(row => ({
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
        subtotal: parseFloat(row.subtotal),
        deliveryCharges: parseFloat(row.delivery_charges),
        total: parseFloat(row.total),
        status: row.status,
        createdAt: row.created_at
      }));
      
      return res.status(200).json(formattedOrders);
    }

    if (req.method === 'POST') {
      const { customer, address, items, subtotal, deliveryCharges, total } = req.body;
      const orderId = 'ORD' + Date.now();
      
      await sql`
        INSERT INTO orders (
          order_id, customer_name, customer_phone, customer_email,
          address_line1, address_line2, city, state, pincode, landmark,
          items, subtotal, delivery_charges, total, status
        ) VALUES (
          ${orderId}, ${customer.name}, ${customer.phone}, ${customer.email || null},
          ${address.line1}, ${address.line2 || null}, ${address.city}, ${address.state}, 
          ${address.pincode}, ${address.landmark || null},
          ${JSON.stringify(items)}, ${subtotal || total}, ${deliveryCharges || 0}, ${total}, 'pending'
        )
      `;
      
      return res.status(200).json({ success: true, orderId });
    }

    if (req.method === 'PUT') {
      const { orderId } = req.query;
      const { status } = req.body;
      
      await sql`UPDATE orders SET status = ${status} WHERE order_id = ${orderId}`;
      
      const { rows } = await sql`SELECT * FROM orders WHERE order_id = ${orderId}`;
      return res.status(200).json(rows[0]);
    }

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message });
  }
}
