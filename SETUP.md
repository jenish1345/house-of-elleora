# Quick Setup Guide for House of Elleora

## What You Need to Do Now:

### 1. Replace the Logo (IMPORTANT!)

I've created a placeholder for your logo. You need to replace it with your actual logo image:

1. Save your logo image (the one you showed me)
2. Rename it to `logo.png`
3. Copy it to the `public` folder
4. Replace the existing `public/logo.png` file

### 2. Install and Run

Open your terminal in this folder and run:

```bash
npm install
```

Then start the website:

```bash
npm start
```

### 3. Test Everything

**Customer Side:**
- Open: http://localhost:3000
- Browse products
- Add items to cart
- Try checkout (fill in test details)

**Admin Side:**
- Open: http://localhost:3000/admin.html
- Add a few test products
- Upload product images
- Check if orders appear

### 4. Add Real Products

Your mom should:
1. Go to admin panel
2. Add each product with:
   - Clear name (e.g., "Pearl Hair Clip")
   - Category (Hair Clips, Hairbands, Earrings, or Bracelets)
   - Price in rupees
   - Stock quantity
   - Nice description
   - Good quality photo

### 5. Update Contact Information

Edit `public/index.html` and find the footer section. Update:
- Email address
- Phone number
- Social media links (Instagram, Facebook, WhatsApp)

### 6. When You're Ready to Go Live

Choose one of these free hosting options:

**Option A: Vercel (Easiest)**
```bash
npm install -g vercel
vercel
```
Follow the prompts - it's super simple!

**Option B: Render**
1. Push code to GitHub
2. Go to render.com
3. Connect GitHub
4. Deploy

## How Orders Work

When a customer places an order:

1. ✅ Order is saved in `orders.json`
2. 📱 Details appear in admin panel immediately
3. 👀 Your mom can see:
   - Customer name & phone
   - Full delivery address
   - All items ordered
   - Total amount
4. 📦 She can update status: Pending → Confirmed → Shipped → Delivered

## Payment Note

Currently, the "Pay with Google Pay" button collects order details but doesn't process actual payments. 

For real payments, you'll need to:
1. Sign up for Razorpay (razorpay.com)
2. Get API keys
3. Integrate (I can help with this later)

For now, you can:
- Accept orders through the website
- Contact customers via phone
- Collect payment via GPay/PhonePe manually
- Update order status in admin panel

## Tips for Your Mom

1. **Check admin panel daily** for new orders
2. **Update order status** so customers know progress
3. **Keep stock updated** - edit products when stock is low
4. **Take good photos** - well-lit, clear background
5. **Respond quickly** to orders

## Backup Important!

Every week, copy these files to a safe place:
- `products.json` (all products)
- `orders.json` (all orders)
- `uploads/` folder (all product images)

## Need Help?

- Check README.md for detailed info
- Test everything in admin panel first
- Keep this guide handy

---

Good luck with House of Elleora! 🎉
