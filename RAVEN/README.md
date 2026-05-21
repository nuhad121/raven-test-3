# RAVEN — Premium Fashion eCommerce (Static)

RAVEN is a fully static online clothing store inspired by [Rokomari.com](https://www.rokomari.com) layout patterns, built for Bangladesh fashion shoppers. HTML5, CSS3, vanilla JavaScript, and Bootstrap 5 — no backend required.

## Features

- **Storefront:** Home, shop, product details, cart, checkout, wishlist, search, contact, about
- **Auth (simulated):** Register, login, OTP verification, forgot password — all via LocalStorage
- **Admin panel:** Products, orders, customers, reviews, coupons, banners, analytics, settings
- **UX:** Dark/light mode, mega menu, flash sale, toasts, skeleton loaders, responsive design

## GitHub Pages (GitHub Actions)

Deployment uses **GitHub Actions** (see `.github/workflows/deploy-pages.yml`).

### One-time setup on GitHub

1. Push this entire `RAVEN` folder to your repo (`index.html` at repo root).
2. Open the repo → **Settings** → **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
4. Push to `main` (or run the workflow manually under **Actions** → **Deploy to GitHub Pages** → **Run workflow**).
5. When the workflow succeeds, open the URL shown in the green **github-pages** environment / workflow summary.

### Push from your PC

```powershell
cd "C:\Users\AH NUHSAD\RAVEN"
git add .
git commit -m "Add GitHub Actions Pages deploy"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

(Use `git push` only if `origin` already exists.)

### Your live URL

| Repo name | Site URL |
|-----------|----------|
| `RAVEN` | `https://YOUR_USERNAME.github.io/RAVEN/` |
| `YOUR_USERNAME.github.io` | `https://YOUR_USERNAME.github.io/` |

### If it still fails

- **Actions** tab → open the latest run → read the error log.
- On GitHub, confirm `index.html` is at the **root** (same level as `README.md`), not inside a nested `RAVEN/` folder.
- **Settings → Pages** must say **Source: GitHub Actions**.
- Wait 2–5 minutes after a green workflow, then hard-refresh.

All asset paths are relative.

## Admin Access (Demo)

| Field | Value |
|-------|--------|
| URL | `/admin/admin-login.html` |
| Email | `mdnuhad534@gmail.com` |
| Password | `Raven@Admin2026` |

## OTP Demo

On register / forgot password, a 6-digit OTP is logged to the **browser console** (F12 → Console).

## Coupons

- `RAVEN10` — 10% off (min ৳1,500)
- `FLAT200` — ৳200 off (min ৳2,000)

## Local Preview

Open `index.html` in a browser, or use a simple static server:

```bash
npx serve .
```

## Project Structure

```
RAVEN/
├── index.html, shop.html, product.html, cart.html, checkout.html
├── login.html, register.html, otp.html, forgot-password.html
├── wishlist.html, dashboard.html, orders.html, search.html
├── contact.html, about.html
├── admin/          # Admin dashboard pages
├── css/            # main.css, admin.css
├── js/             # App logic & LocalStorage DB
└── assets/         # images, banners, icons
```

## Tech Stack

- HTML5 / CSS3
- Bootstrap 5.3
- Vanilla JavaScript
- LocalStorage (products, orders, users, cart, sessions)

---

© RAVEN — Demo static storefront. Not affiliated with Rokomari.com.
