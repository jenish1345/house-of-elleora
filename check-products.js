const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://c0135a2403d9e2c9d6d193fb61c9735758a21ea8294c1981f649f4e7f551c6ed:sk_zOltAe07ew_IgXJNjPIME@db.prisma.io:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function checkProducts() {
  try {
    // Check total products
    const total = await pool.query('SELECT COUNT(*) FROM products');
    console.log('Total products:', total.rows[0].count);
    
    // Check products with Cloudinary images
    const cloudinary = await pool.query(`
      SELECT COUNT(*) FROM products 
      WHERE image LIKE 'https://res.cloudinary.com%'
    `);
    console.log('Products with Cloudinary images:', cloudinary.rows[0].count);
    
    // Check products with base64 images
    const base64 = await pool.query(`
      SELECT COUNT(*) FROM products 
      WHERE image LIKE 'data:image%'
    `);
    console.log('Products with base64 images:', base64.rows[0].count);
    
    // Show first 5 products
    const sample = await pool.query(`
      SELECT id, name, LEFT(image, 50) as image_preview, created_at 
      FROM products 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('\nSample products:');
    console.table(sample.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkProducts();
