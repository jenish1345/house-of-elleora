const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://c0135a2403d9e2c9d6d193fb61c9735758a21ea8294c1981f649f4e7f551c6ed:sk_zOltAe07ew_IgXJNjPIME@db.prisma.io:5432/postgres?sslmode=require',
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
