// getStore is handed in by each function file (ESM import), so the bundler
// always packs @netlify/blobs into the function.
let getStore = null;
function init(fn) {
  getStore = fn;
}

// Shop data lives in Netlify Blobs (built into Netlify, no extra account or keys).
// "shop" store: key "products" -> array of products, key "orders" -> array of orders.
// "images" store: uploaded product photos.

function shopStore() {
  return getStore({ name: 'shop', consistency: 'strong' });
}

function imageStore() {
  return getStore({ name: 'images', consistency: 'strong' });
}

async function readList(store, key) {
  return (await store.get(key, { type: 'json' })) || [];
}

async function writeList(store, key, list) {
  await store.setJSON(key, list);
}

module.exports = { init, shopStore, imageStore, readList, writeList };
