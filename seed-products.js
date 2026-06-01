// This script seeds the database with products from products.json
// Run this once to populate your Netlify database

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function seedProducts() {
  console.log('🌱 Starting database seeding...\n');

  // Check if database URL is provided
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL environment variable not set');
    console.log('💡 Set it with: export POSTGRES_URL="your-database-url"');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Create products table if it doesn't exist
    console.log('📋 Creating products table if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category TEXT,
        stock INTEGER DEFAULT 0,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table ready\n');

    // Read products from JSON
    const productsPath = path.join(__dirname, 'products.json');
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

    console.log(`📦 Found ${products.length} product(s) to seed\n`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      // Check if product already exists
      const existing = await pool.query('SELECT id FROM products WHERE id = $1', [product.id]);
      
      if (existing.rows.length > 0) {
        console.log(`⏭️  Skipping "${product.name}" - already exists`);
        skippedCount++;
        continue;
      }

      // Insert product
      await pool.query(
        `INSERT INTO products (id, name, description, price, category, stock, image, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          product.id,
          product.name,
          product.description,
          product.price,
          product.category,
          product.stock,
          product.image,
          product.createdAt || new Date().toISOString()
        ]
      );

      console.log(`✅ Inserted "${product.name}"`);
      insertedCount++;
    }

    console.log(`\n✨ Seeding complete!`);
    console.log(`   Inserted: ${insertedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${products.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedProducts();
