const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Initialize products file
const PRODUCTS_FILE = 'products.json';
const ORDERS_FILE = 'orders.json';

if (!fs.existsSync(PRODUCTS_FILE)) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
}

// Get all products
app.get('/api/products', (req, res) => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE));
  res.json(products);
});

// Add new product
app.post('/api/products', upload.single('image'), (req, res) => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE));
  const newProduct = {
    id: Date.now().toString(),
    name: req.body.name,
    category: req.body.category,
    price: parseFloat(req.body.price),
    stock: parseInt(req.body.stock),
    description: req.body.description,
    image: req.file ? `/uploads/${req.file.filename}` : '/images/placeholder.jpg',
    createdAt: new Date().toISOString()
  };
  products.push(newProduct);
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  res.json(newProduct);
});

// Update product
app.put('/api/products/:id', upload.single('image'), (req, res) => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE));
  const index = products.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    products[index] = {
      ...products[index],
      name: req.body.name,
      category: req.body.category,
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock),
      description: req.body.description,
      image: req.file ? `/uploads/${req.file.filename}` : products[index].image
    };
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    res.json(products[index]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE));
  const filtered = products.filter(p => p.id !== req.params.id);
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(filtered, null, 2));
  res.json({ success: true });
});

// Get all orders
app.get('/api/orders', (req, res) => {
  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  res.json(orders);
});

// Create new order
app.post('/api/orders', (req, res) => {
  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  const newOrder = {
    orderId: 'ORD' + Date.now(),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  orders.push(newOrder);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  
  // Log order notification
  console.log('\n🎉 NEW ORDER RECEIVED! 🎉');
  console.log('Order ID:', newOrder.orderId);
  console.log('Customer:', newOrder.customer.name);
  console.log('Phone:', newOrder.customer.phone);
  console.log('Total:', '₹' + newOrder.total);
  console.log('Delivery Address:');
  console.log(`  ${newOrder.address.line1}`);
  if (newOrder.address.line2) console.log(`  ${newOrder.address.line2}`);
  console.log(`  ${newOrder.address.city}, ${newOrder.address.state} - ${newOrder.address.pincode}`);
  if (newOrder.address.landmark) console.log(`  Landmark: ${newOrder.address.landmark}`);
  console.log('\nItems:');
  newOrder.items.forEach(item => {
    console.log(`  - ${item.name} x ${item.quantity} = ₹${item.price * item.quantity}`);
  });
  if (newOrder.deliveryCharges) {
    console.log(`\nDelivery Charges: ₹${newOrder.deliveryCharges}`);
  }
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Send WhatsApp notification
  sendWhatsAppNotification(newOrder);
  
  res.json({ success: true, orderId: newOrder.orderId });
});

// WhatsApp notification function
function sendWhatsAppNotification(order) {
  // Create WhatsApp message
  const message = `🎉 *NEW ORDER - House of Elleora*

📦 *Order ID:* ${order.orderId}

👤 *Customer Details:*
Name: ${order.customer.name}
Phone: ${order.customer.phone}
${order.customer.email ? `Email: ${order.customer.email}` : ''}

📍 *Delivery Address:*
${order.address.line1}
${order.address.line2 ? order.address.line2 + '\n' : ''}${order.address.city}, ${order.address.state} - ${order.address.pincode}
${order.address.landmark ? `Landmark: ${order.address.landmark}` : ''}

🛍️ *Items Ordered:*
${order.items.map(item => `• ${item.name} x ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`).join('\n')}

💰 *Payment Details:*
Subtotal: ₹${order.subtotal ? order.subtotal.toFixed(2) : order.total.toFixed(2)}
${order.deliveryCharges ? `Delivery: ₹${order.deliveryCharges.toFixed(2)}` : 'Delivery: FREE'}
*Total: ₹${order.total.toFixed(2)}*

⏰ Order Time: ${new Date(order.createdAt).toLocaleString('en-IN')}

---
Check admin panel for more details!`;

  // Open WhatsApp Web with pre-filled message
  const whatsappUrl = `https://wa.me/919488639502?text=${encodeURIComponent(message)}`;
  
  console.log('\n📱 WhatsApp Notification Ready!');
  console.log('Open this link to send notification to your mom:');
  console.log(whatsappUrl);
  console.log('\nOr scan this in your phone to send via WhatsApp\n');
}

// Update order status
app.put('/api/orders/:orderId', (req, res) => {
  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  const index = orders.findIndex(o => o.orderId === req.params.orderId);
  if (index !== -1) {
    orders[index].status = req.body.status;
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    res.json(orders[index]);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});
