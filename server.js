const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

// Email configuration (using Gmail as example)
// For production, use environment variables
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

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
    
    // Send status update email
    if (orders[index].customer.email) {
      sendOrderStatusEmail(orders[index]);
    }
    
    res.json(orders[index]);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Send email endpoint
app.post('/api/send-email', async (req, res) => {
  const { type, to, subject, data } = req.body;
  
  try {
    let htmlContent = '';
    
    if (type === 'order') {
      htmlContent = generateOrderEmailHTML(data);
    } else if (type === 'review') {
      htmlContent = generateReviewEmailHTML(data);
    }
    
    const mailOptions = {
      from: '"House of Elleora" <noreply@houseofelleora.com>',
      to: to,
      subject: subject,
      html: htmlContent
    };
    
    // Only send if email is configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await emailTransporter.sendMail(mailOptions);
      res.json({ success: true, message: 'Email sent successfully' });
    } else {
      // In development, just log the email
      console.log('\n📧 EMAIL NOTIFICATION (Development Mode)');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Content:', htmlContent.substring(0, 200) + '...');
      res.json({ success: true, message: 'Email logged (dev mode)' });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Email template generators
function generateOrderEmailHTML(orderData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #d97398; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
        .button { display: inline-block; background: #d97398; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 15px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌸 House of Elleora</h1>
          <p>Her Aura, Her Charm</p>
        </div>
        <div class="content">
          <h2>Thank you for your order!</h2>
          <p>Hi ${orderData.customer.name},</p>
          <p>We've received your order and will process it shortly.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
            <p><strong>Order Date:</strong> ${new Date(orderData.createdAt).toLocaleDateString()}</p>
            
            <h4>Items:</h4>
            <table>
              ${orderData.items.map(item => `
                <tr>
                  <td>${item.name} x ${item.quantity}</td>
                  <td style="text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr style="font-weight: bold;">
                <td>Total</td>
                <td style="text-align: right;">₹${orderData.total.toFixed(2)}</td>
              </tr>
            </table>
            
            <h4>Delivery Address:</h4>
            <p>
              ${orderData.address.line1}<br>
              ${orderData.address.line2 ? orderData.address.line2 + '<br>' : ''}
              ${orderData.address.city}, ${orderData.address.state} - ${orderData.address.pincode}
            </p>
          </div>
          
          <p>We'll notify you when your order is shipped.</p>
          <p>For any queries, contact us at:</p>
          <p>📞 +91 9488639502<br>
          📧 info@houseofelleora.com</p>
          
          <center>
            <a href="https://wa.me/919488639502" class="button">Contact Us on WhatsApp</a>
          </center>
        </div>
        <div class="footer">
          <p>© 2026 House of Elleora. All rights reserved.</p>
          <p>Follow us on Instagram: @house.of.elleora</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateReviewEmailHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #d97398; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .review-box { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .stars { color: #ffc107; font-size: 1.5em; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌸 House of Elleora</h1>
          <p>Thank You for Your Review!</p>
        </div>
        <div class="content">
          <h2>Hi ${data.customerName}! 🌟</h2>
          <p>Thank you for taking the time to review <strong>${data.productName}</strong>!</p>
          
          <div class="review-box">
            <p><strong>Your Rating:</strong></p>
            <div class="stars">${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}</div>
            <p style="margin-top: 15px;"><strong>Your Review:</strong></p>
            <p style="font-style: italic;">"${data.reviewText}"</p>
          </div>
          
          <p>Your feedback helps us improve and helps other customers make informed decisions.</p>
          <p>As a token of appreciation, use code <strong>REVIEW10</strong> for 10% off your next purchase!</p>
          
          <p>Happy Shopping! ❤️</p>
          <p><strong>Team House of Elleora</strong></p>
        </div>
        <div class="footer">
          <p>© 2026 House of Elleora. All rights reserved.</p>
          <p>📞 +91 9488639502 | 📧 info@houseofelleora.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function sendOrderStatusEmail(order) {
  if (!order.customer.email) return;
  
  const statusMessages = {
    confirmed: 'Your order has been confirmed!',
    shipped: 'Your order has been shipped!',
    delivered: 'Your order has been delivered!',
    cancelled: 'Your order has been cancelled'
  };
  
  const subject = statusMessages[order.status] || 'Order Status Update';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #d97398; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .status-badge { display: inline-block; background: #28a745; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌸 House of Elleora</h1>
        </div>
        <div class="content">
          <h2>${statusMessages[order.status]}</h2>
          <p>Hi ${order.customer.name},</p>
          <p>Your order <strong>${order.orderId}</strong> status has been updated.</p>
          <p><span class="status-badge">${order.status.toUpperCase()}</span></p>
          <p>For any queries, contact us at +91 9488639502</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const mailOptions = {
    from: '"House of Elleora" <noreply@houseofelleora.com>',
    to: order.customer.email,
    subject: subject,
    html: htmlContent
  };
  
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    emailTransporter.sendMail(mailOptions).catch(err => console.error('Email error:', err));
  } else {
    console.log('\n📧 ORDER STATUS EMAIL (Dev Mode)');
    console.log('To:', order.customer.email);
    console.log('Subject:', subject);
  }
}

// Export for Vercel
module.exports = app;

// Only listen if not in Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin-login.html`);
  });
}
