# House of Elleora - Women's Accessories Shop

**"Her Aura, Her Charm"**

A beautiful e-commerce website for House of Elleora, featuring women's accessories like hair clips, hairbands, earrings, and bracelets.

## ✨ Features

- 🛍️ Beautiful product showcase with elegant pink theme
- 🛒 Shopping cart with real-time updates
- 💳 Google Pay / UPI payment integration
- 📦 Order management system
- 📱 Fully mobile responsive
- 👩‍💼 Easy admin panel for your mom
- 📧 Order notifications with customer details and delivery address

## 🚀 Getting Started

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Start the Website

```bash
npm start
```

The website will be available at:
- **Shop (for customers)**: http://localhost:3000
- **Admin Panel (for your mom)**: http://localhost:3000/admin.html

## 📖 How to Use

### For Your Mom (Admin Panel):

1. Go to: http://localhost:3000/admin.html
2. **Add Products:**
   - Fill in product name, category, price, stock, description
   - Upload a clear product photo
   - Click "Add Product"
3. **Manage Orders:**
   - View all customer orders with full details
   - See customer name, phone, email
   - View complete delivery address
   - Update order status (Pending → Confirmed → Shipped → Delivered)
4. **Edit/Delete Products:**
   - Click "Edit" to update product details
   - Click "Delete" to remove products

### For Customers:

1. Visit: http://localhost:3000
2. Browse products by category
3. Add items to cart
4. Click cart icon to review
5. Proceed to checkout
6. Fill in delivery details
7. Pay with Google Pay/UPI

## 💰 Payment Integration

The website supports:
- Google Pay (Primary)
- PhonePe
- Paytm
- Any UPI app

When a customer places an order:
1. Order details are saved
2. Your mom gets notified in the admin panel
3. Customer details and delivery address are captured
4. Order can be tracked through status updates

## 📦 Order Notifications

When someone orders, your mom will see:
- Customer name and phone number
- Email address (if provided)
- Complete delivery address with landmark
- All ordered items with quantities
- Total amount
- Order timestamp

## 🌐 Publishing Online

### Option 1: Vercel (Recommended - Free & Easy)

1. Create account at https://vercel.com
2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Deploy:
   ```bash
   vercel
   ```
4. Follow the prompts - done!

### Option 2: Render (Free)

1. Create account at https://render.com
2. Connect your GitHub repository
3. Deploy as Web Service
4. Set start command: `npm start`

### Option 3: Railway (Free tier available)

1. Go to https://railway.app
2. Connect GitHub
3. Deploy with one click

## 📁 File Structure

```
house-of-elleora/
├── public/
│   ├── index.html          # Customer shop
│   ├── admin.html          # Admin panel
│   ├── style.css           # Beautiful pink theme
│   ├── admin-style.css     # Admin styles
│   ├── script.js           # Shop functionality
│   ├── admin-script.js     # Admin functionality
│   └── logo.png            # Your logo
├── uploads/                # Product images
├── products.json           # Product database
├── orders.json             # Orders database
├── server.js               # Backend server
├── package.json            # Dependencies
└── README.md               # This file
```

## 💡 Tips for Success

1. **Product Photos:**
   - Use good lighting
   - Clean background
   - Show product clearly
   - Multiple angles if possible

2. **Product Descriptions:**
   - Be descriptive
   - Mention materials
   - Include size/dimensions
   - Highlight unique features

3. **Pricing:**
   - Research competitor prices
   - Include all costs
   - Offer combo deals

4. **Stock Management:**
   - Update regularly
   - Set low stock alerts
   - Remove out-of-stock items

5. **Customer Service:**
   - Respond quickly to orders
   - Update order status promptly
   - Keep delivery promises

## 🔒 Important Notes

- **Backup regularly**: Copy `products.json` and `orders.json` files
- **Logo**: Replace `public/logo.png` with your actual logo file
- **Contact info**: Update phone/email in footer
- **Payment**: For real payments, integrate with Razorpay or similar

## 📞 Support

If you need help:
- Check this README
- Look at code comments
- Test in admin panel first

## 🎨 Customization

The pink color theme matches your logo. To change colors, edit `public/style.css`:
- `--primary`: Main pink color (#d97398)
- `--accent`: Light pink background (#fce4ec)

---

Made with ❤️ for House of Elleora
