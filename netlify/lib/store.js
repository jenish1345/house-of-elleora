const { connectLambda, getStore } = require('@netlify/blobs');

// Shop data lives in Netlify Blobs (built into Netlify, no extra account or keys).
// "shop" store: key "products" -> array of products, key "orders" -> array of orders.
// "images" store: uploaded product photos.

function shopStore(event) {
  connectLambda(event);
  return getStore({ name: 'shop', consistency: 'strong' });
}

function imageStore(event) {
  connectLambda(event);
  return getStore({ name: 'images', consistency: 'strong' });
}

async function readList(store, key) {
  return (await store.get(key, { type: 'json' })) || [];
}

async function writeList(store, key, list) {
  await store.setJSON(key, list);
}

module.exports = { shopStore, imageStore, readList, writeList };
