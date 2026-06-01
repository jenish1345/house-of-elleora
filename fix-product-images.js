const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'duqkjg5me',
  api_key: '299332211855378',
  api_secret: 'jEPEp_8p4YkjLj6Q4P822WrUS44'
});

async function fixProductImages() {
  console.log('🔧 Starting to fix product images...\n');

  // Read products.json
  const productsPath = path.join(__dirname, 'products.json');
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

  console.log(`📦 Found ${products.length} product(s) to process\n`);

  let updatedCount = 0;

  for (const product of products) {
    console.log(`Processing: ${product.name}`);
    console.log(`Current image: ${product.image}`);

    // Check if image is already a Cloudinary URL
    if (product.image.startsWith('https://res.cloudinary.com')) {
      console.log('✅ Already using Cloudinary URL, skipping\n');
      continue;
    }

    // Check if it's a local path
    if (product.image.startsWith('/uploads/')) {
      const localImagePath = path.join(__dirname, 'uploads', path.basename(product.image));
      
      if (!fs.existsSync(localImagePath)) {
        console.log(`❌ Local image not found: ${localImagePath}\n`);
        continue;
      }

      try {
        console.log('📤 Uploading to Cloudinary...');
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(localImagePath, {
          folder: 'house-of-elleora',
          public_id: `product-${product.id}`,
          overwrite: true,
          resource_type: 'auto'
        });

        // Update product with Cloudinary URL
        product.image = result.secure_url;
        updatedCount++;

        console.log(`✅ Uploaded successfully!`);
        console.log(`New URL: ${result.secure_url}\n`);
      } catch (error) {
        console.error(`❌ Error uploading image: ${error.message}\n`);
      }
    }
  }

  if (updatedCount > 0) {
    // Save updated products.json
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    console.log(`\n✨ Success! Updated ${updatedCount} product(s)`);
    console.log(`📝 products.json has been updated with Cloudinary URLs`);
    console.log(`\n🚀 Next step: Push to GitHub with: git add products.json && git commit -m "Update product images to Cloudinary" && git push`);
  } else {
    console.log('\n✅ No products needed updating');
  }
}

// Run the script
fixProductImages().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
