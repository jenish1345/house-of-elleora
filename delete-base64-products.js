const { Pool } = require('pg');

const POSTGRES_URL = process.env.POSTGRES_URL;

async function deleteBase64Products() {
  const pool = new Pool({
    connectionString: POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Finding products without Cloudinary images...\n');
    
    // Find products with base64 images (not Cloudinary URLs)
    const result = await pool.query(`
      SELECT id, name, image 
      FROM products 
      WHERE image LIKE 'data:image%'
    `);
    
    const productsToDelete = result.rows;
    
    console.log(`Found ${productsToDelete.length} products without Cloudinary images:\n`);
    productsToDelete.forEach(p => console.log(`  - ${p.name}`));
    
    if (productsToDelete.length > 0) {
      console.log(`\n🗑️  Deleting these products...\n`);
      
      for (const product of productsToDelete) {
        await pool.query('DELETE FROM products WHERE id = $1', [product.id]);
        console.log(`  ✅ Deleted: ${product.name}`);
      }
      
      console.log(`\n✅ Deleted ${productsToDelete.length} products!`);
      console.log(`Your mom can re-add them later with compressed images.`);
    } else {
      console.log('\n✅ All products have Cloudinary images!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

deleteBase64Products();
