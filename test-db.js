const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function testDB() {
  try {
    const result = await pool.query('SELECT * FROM products');
    console.log('Products found:', result.rows.length);
    console.log('Products:', JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testDB();
