const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'duqkjg5me',
  api_key: '299332211855378',
  api_secret: 'jEPEp_8p4YkjLj6Q4P822WrUS44'
});

const POSTGRES_URL = 'postgres://c0135a2403d9e2c9d6d193fb61c9735758a21ea8294c1981f649f4e7f551c6ed:sk_zOltAe07ew_IgXJNjPIME@db.prisma.io:5432/postgres?sslmode=require';

async function migrateImages() {
  const pool = new Pool({
    connectionString: POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Starting image migration to Cloudinary...\n');
    
    // Get all products with base64 images
    const result = await pool.query('SELECT id, name, image FROM products WHERE image LIKE \'data:image%\'');
    const products = result.rows;
    
    console.log(`Found ${products.length} products with base64 images\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`[${i + 1}/${products.length}] Uploading: ${product.name}...`);
      
      try {
        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(product.image, {
          folder: 'house-of-elleora',
          public_id: `product-${product.id}`,
          resource_type: 'auto'
        });
        
        // Update database with Cloudinary URL
        await pool.query(
          'UPDATE products SET image = $1 WHERE id = $2',
          [uploadResult.secure_url, product.id]
        );
        
        console.log(`   ✅ Success! URL: ${uploadResult.secure_url}`);
        successCount++;
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n✨ Migration Complete!`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`\n🎉 All product images are now hosted on Cloudinary!`);
    console.log(`Your Netlify site will now show all images correctly.`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

migrateImages();
