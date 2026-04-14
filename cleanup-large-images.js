const { Pool } = require('pg');

const POSTGRES_URL = 'postgres://c0135a2403d9e2c9d6d193fb61c9735758a21ea8294c1981f649f4e7f551c6ed:sk_zOltAe07ew_IgXJNjPIME@db.prisma.io:5432/postgres?sslmode=require';

async function cleanupLargeImages() {
  const pool = new Pool({
    connectionString: POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Checking for products with large images...');
    
    // Get all products
    const result = await pool.query('SELECT id, name, image FROM products');
    const products = result.rows;
    
    console.log(`Found ${products.length} total products`);
    
    const largeProducts = [];
    const normalProducts = [];
    
    products.forEach(product => {
      const imageSize = product.image ? product.image.length : 0;
      const imageSizeMB = (imageSize / 1024 / 1024).toFixed(2);
      
      if (imageSize > 6000000) { // 6MB
        largeProducts.push({
          id: product.id,
          name: product.name,
          size: imageSizeMB
        });
      } else {
        normalProducts.push(product.name);
      }
    });
    
    console.log(`\n✅ Products with normal images (${normalProducts.length}):`);
    normalProducts.forEach(name => console.log(`  - ${name}`));
    
    console.log(`\n⚠️  Products with large images (${largeProducts.length}):`);
    largeProducts.forEach(p => console.log(`  - ${p.name} (${p.size} MB)`));
    
    if (largeProducts.length > 0) {
      console.log('\n🗑️  Deleting products with large images...');
      
      for (const product of largeProducts) {
        await pool.query('DELETE FROM products WHERE id = $1', [product.id]);
        console.log(`  ✓ Deleted: ${product.name}`);
      }
      
      console.log(`\n✅ Cleanup complete! Deleted ${largeProducts.length} products.`);
      console.log('Your mom can re-add these products with compressed images from the admin panel.');
    } else {
      console.log('\n✅ No products with large images found!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

cleanupLargeImages();
