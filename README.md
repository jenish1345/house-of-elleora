# House of Elleora

Online shop for women's accessories: https://houseofelleora.netlify.app

## How it works

- `public/`: the website (shop page `index.html`, admin page `admin.html`)
- `netlify/functions/`: the API (`/api/products`, `/api/orders`, `/api/upload-image`, `/api/admin-login`)
- `netlify.toml`: Netlify build settings, security headers, caching
- Deploys automatically when you push to `main` on GitHub

## Where data is stored

Everything is in **Netlify Blobs** (built into Netlify, no extra accounts or keys):

- store `shop`, key `products`: list of products
- store `shop`, key `orders`: list of orders
- store `images`: product photos uploaded from the admin page (served at `/api/image?key=...`)

Older product photos still load from their Cloudinary links.

## Environment variables (set in Netlify, never in code)

| Name | What it is |
|---|---|
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin page login |
| `ADMIN_TOKEN_SECRET` | Random string used to sign admin sessions |
