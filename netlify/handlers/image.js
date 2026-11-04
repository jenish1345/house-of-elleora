const { imageStore } = require('../lib/store');

// Serves product photos uploaded through the admin page
exports.handler = async (event, context) => {
  const key = event.queryStringParameters?.key || '';
  if (!/^product-[a-zA-Z0-9_-]+$/.test(key)) {
    return { statusCode: 400, body: 'Bad image key' };
  }

  try {
    const result = await imageStore().getWithMetadata(key, { type: 'arrayBuffer' });
    if (!result) return { statusCode: 404, body: 'Image not found' };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': result.metadata?.contentType || 'image/jpeg',
        // Keys never change content, so browsers can keep them for a year
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      body: Buffer.from(result.data).toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Image read error:', error);
    return { statusCode: 500, body: 'Could not load image' };
  }
};
