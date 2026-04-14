const { Pool } = require('pg');

const POSTGRES_URL = 'postgres://c0135a2403d9e2c9d6d193fb61c9735758a21ea8294c1981f649f4e7f551c6ed:sk_zOltAe07ew_IgXJNjPIME@db.prisma.io:5432/postgres?sslmode=require';

async function compressImages() {
  const pool = new Pool({
    connectionString: POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Analyzing image sizes...\n');
    
    const result = await pool.query('SELECT id, name, image FROM products');
    const products = result.rows;
    
    let totalSize = 0;
    let base64Count = 0;
    
    products.forEach(product => {
      const imageSize = product.image ? product.image.length : 0;
      totalSize += imageSize;
      
      if (product.image && product.image.startsWith('data:image')) {
        base64Count++;
        const sizeMB = (imageSize / 1024 / 1024).toFixed(2);
        console.log(`${product.name}: ${sizeMB} MB`);
      }
    });
    
    const totalMB = (totalSize / 1024 / 1024).toFixed(2);
    
    console.log(`\n📊 Summary:`);
    console.log(`Total products: ${products.length}`);
    console.log(`Products with base64 images: ${base64Count}`);
    console.log(`Total image data size: ${totalMB} MB`);
    console.log(`\n⚠️  Problem: Base64 images are stored in database, making it ${totalMB} MB`);
    console.log(`This causes high bandwidth usage on Vercel.`);
    console.log(`\n💡 Solution: Move images to Cloudinary (free 25GB bandwidth/month)`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

compressImages();
