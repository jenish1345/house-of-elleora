# 📱 How to Add Payment QR Code

## Quick Steps:

1. **Save the QR code image** (the PhonePe QR code you showed me)
2. **Rename it to:** `payment-qr.jpg`
3. **Put it in:** `public/images/` folder

## Option 1: Using Finder/File Explorer (Easiest)

1. Open your project folder: `house_of_elleora`
2. Go to: `public/images/`
3. Copy your QR code image there
4. Rename it to: `payment-qr.jpg`
5. Run these commands:
   ```bash
   git add public/images/payment-qr.jpg
   git commit -m "Add payment QR code"
   git push
   ```

## Option 2: Using Command Line

```bash
# If your QR code is on Desktop
cp ~/Desktop/qr-code.jpg public/images/payment-qr.jpg

# Or if it's in Downloads
cp ~/Downloads/qr-code.jpg public/images/payment-qr.jpg

# Then push to GitHub
git add public/images/payment-qr.jpg
git commit -m "Add payment QR code"
git push
```

## ✅ After Adding:

The payment modal will show your QR code with:
- "Scan & Pay Using PhonePe App"
- Your QR code image
- "ANTONY JEYAKUMAR"

---

**Do this now, then your website will be 100% complete!** 🎉
