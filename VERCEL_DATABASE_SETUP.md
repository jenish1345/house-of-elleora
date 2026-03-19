# 🗄️ Vercel Database Setup Instructions

## Step 1: Create Vercel Postgres Database

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: `house-of-elleora`
3. Click on the "Storage" tab
4. Click "Create Database"
5. Select "Postgres"
6. Choose "Continue" (free tier)
7. Name it: `house-of-elleora-db`
8. Click "Create"

## Step 2: Connect Database to Project

1. After creating, Vercel will automatically connect it to your project
2. Environment variables will be added automatically
3. No manual configuration needed!

## Step 3: Deploy

1. Push code to GitHub (already done)
2. Vercel will automatically redeploy
3. Database tables will be created automatically on first use

## ✅ What This Gives You:

- **Permanent storage** - Products and orders never disappear
- **Free tier** - 256 MB storage, 60 hours compute time/month
- **Automatic backups** - Vercel handles it
- **Fast** - Database in same region as your app

## 📝 How Admin Posts Products:

1. Go to: https://houseofelleora.vercel.app/admin-login.html
2. Login with credentials
3. Add products with images
4. Products are saved permanently in database
5. Never lost, even after redeployments!

## 🔧 After Setup:

Your website will have:
- ✅ Permanent product storage
- ✅ Permanent order storage
- ✅ Image storage (base64 in database)
- ✅ No data loss on redeploy

---

**Next Steps:**
1. Create database in Vercel dashboard
2. Wait for automatic redeploy
3. Test admin panel
4. Add products!
