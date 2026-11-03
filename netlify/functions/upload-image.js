const cloudinary = require('cloudinary').v2;
const { isAdmin, unauthorized, JSON_HEADERS } = require('../lib/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.handler = async (event, context) => {
  const headers = JSON_HEADERS;

  if (!isAdmin(event)) return unauthorized();

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { image, productId } = JSON.parse(event.body);
    if (typeof image !== 'string' || !image.startsWith('data:image/')) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Only image uploads are allowed' }) };
    }
    
    if (!image) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No image provided' })
      };
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: 'house-of-elleora',
      public_id: `product-${productId}`,
      overwrite: true,
      resource_type: 'image'
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        url: result.secure_url
      })
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to upload image' })
    };
  }
};
