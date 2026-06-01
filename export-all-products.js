const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgres://c0135a2403d9e2c9d6d193fb61c9735758a21ea8294c1981f649f4e7f551c6ed:sk_zOltAe07ew_IgXJNjPIME@db.prisma.io:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function exportAllProducts() {
  try {
    console.log('📦 Exporting all products from database...\n');
    
    // Get all products with Cloudinary images
    const result = await pool.query(`
      SELECT id, name, description, price, category, stock, image, created_at 
      FROM products 
      WHERE image LIKE 'https://res.cloudinary.com%'
      ORDER BY created_at DESC
    `);
    
    const products = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      price: parseFloat(row.price),
      stock: row.stock,
      description: row.description,
      image: row.image,
      createdAt: row.created_at
    }));
    
    console.log(`✅ Found ${products.length} products with Cloudinary images\n`);
    
    // Show sample
    console.log('Sample products:');
    products.slice(0, 10).forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} - ₹${p.price} (${p.category})`);
    });
    
    if (products.length > 10) {
      console.log(`... and ${products.length - 10} more products\n`);
    }
    
    // Save to products.json
    fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
    console.log(`\n✅ Exported ${products.length} products to products.json`);
    
    // Also save a backup
    const backupFile = `products-backup-${Date.now()}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(products, null, 2));
    console.log(`✅ Created backup: ${backupFile}`);
    
    console.log('\n🎉 All products exported successfully!');
    console.log('\nNext steps:');
    console.log('1. Push to GitHub: git add products.json && git commit -m "Restore all 115 products from database" && git push');
    console.log('2. Update Netlify function with all products');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

exportAllProducts();
