# House of Elleora

Online shop for women's accessories: https://houseofelleora.netlify.app

## How it works

- `public/`: the website (shop page `index.html`, admin page `admin.html`)
- `netlify/functions/`: the API (`/api/products`, `/api/orders`, `/api/upload-image`, `/api/admin-login`)
- `netlify.toml`: Netlify build settings, security headers, caching
- Deploys automatically when you push to `main` on GitHub

## Environment variables (set in Netlify, never in code)

| Name | What it is |
|---|---|
| `POSTGRES_URL` | Database connection link |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Image hosting |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin page login |
| `ADMIN_TOKEN_SECRET` | Random string used to sign admin sessions |

## Scripts

Need `POSTGRES_URL` set in your terminal first.

- `npm run seed`: load `netlify/functions/products-data.json` into the database
- `npm run export`: download all products from the database into `products.json`
