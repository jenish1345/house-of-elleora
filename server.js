const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory storage for Vercel (since file system is read-only)
let products = [];
let orders = [];

// File upload configuration (memory storage for Vercel)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Add new product
app.post('/api/products', upload.single('image'), (req, res) => {
  const newProduct = {
    id: Date.now().toString(),
    name: req.body.name,
    category: req.body.category,
    price: parseFloat(req.body.price),
    stock: parseInt(req.body.stock),
    description: req.body.description,
    image: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : '/images/placeholder.jpg',
    createdAt: new Date().toISOString()
  };
  products.push(newProduct);
  res.json(newProduct);
});

// Update product
app.put('/api/products/:id', upload.single('image'), (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    products[index] = {
      ...products[index],
      name: req.body.name,
      category: req.body.category,
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock),
      description: req.body.description,
      image: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : products[index].image
    };
    res.json(products[index]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  res.json({ success: true });
});

// Get all orders
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// Create new order
app.post('/api/orders', (req, res) => {
  const newOrder = {
    orderId: 'ORD' + Date.now(),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  orders.push(newOrder);
  
  // Log order notification
  console.log('\n🎉 NEW ORDER RECEIVED! 🎉');
  console.log('Order ID:', newOrder.orderId);
  console.log('Customer:', newOrder.customer.name);
  console.log('Phone:', newOrder.customer.phone);
  console.log('Total:', '₹' + newOrder.total);
  
  res.json({ success: true, orderId: newOrder.orderId });
});

// Update order status
app.put('/api/orders/:orderId', (req, res) => {
  const index = orders.findIndex(o => o.orderId === req.params.orderId);
  if (index !== -1) {
    orders[index].status = req.body.status;
    res.json(orders[index]);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Export for Vercel
module.exports = app;

// Only listen if not in Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin-login.html`);
  });
}
