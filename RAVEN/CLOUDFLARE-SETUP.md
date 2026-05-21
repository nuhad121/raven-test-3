# RAVEN — Cloudflare Pages সম্পূর্ণ সেটআপ (ahnuhad.site)

Manual **Upload assets** ব্যবহার করবেন না — `wrangler.toml` থাকায় সেটা কাজ করে না।  
নিচের **৩ নম্বর উপায়** (GitHub Actions) বা **২ নম্বর** (`npm run deploy`) ব্যবহার করুন।

---

## আপনার সাইটে যা চলবে

| URL | কাজ |
|-----|-----|
| `https://ahnuhad.site` | দোকান (HTML/CSS/JS) |
| `/api/send-otp` | Brevo দিয়ে OTP মেইল |
| `/api/users` | সব ডিভাইসের customer → admin panel |

---

## ধাপ ১ — Cloudflare-এ project তৈরি (একবার)

1. https://dash.cloudflare.com/ → **Workers & Pages**
2. **Create** → **Pages** → **Connect to Git** (অথবা পরে CLI দিয়ে deploy)
3. Project name: **`ahnuhad`** (যদি অন্য নাম দেন, `package.json` ও `wrangler.toml`-এ নাম মিলিয়ে নিন)

---

## ধাপ ২ — KV (সব ডিভাইসের user admin-এ)

1. **Workers & Pages** → **KV** → **Create a namespace**
   - Name: `raven-users`
2. **Pages** → project **ahnuhad** → **Settings** → **Bindings** → **Add** → **KV namespace**
   - Variable name: `RAVEN_KV` (ঠিক এই নাম)
   - KV namespace: `raven-users`
3. **Save**

---

## ধাপ ৩ — Environment variables (একবার)

**Pages → ahnuhad → Settings → Environment variables → Production**

| Variable | Value |
|----------|--------|
| `BREVO_API_KEY` | Brevo API key |
| `BREVO_SENDER_EMAIL` | `mdnuhad534@gmail.com` |
| `BREVO_SENDER_NAME` | `RAVEN` |
| `ALLOWED_ORIGINS` | `https://ahnuhad.site,https://www.ahnuhad.site` |
| `ADMIN_API_KEY` | `Raven@Admin2026` (admin login password) |

**Save** → **Deployments** → সর্বশেষ deploy → **Retry deployment**

---

## ধাপ ৪ — Deploy করুন (৩ উপায়ের একটা)

### উপায় A — GitHub Actions (সবচেয়ে সহজ, push = auto deploy)

1. GitHub repo **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret name | কোথায় পাবেন |
|-------------|----------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → Profile → **API Tokens** → Create → **Edit Cloudflare Workers** template |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard URL: `dash.cloudflare.com/`**`xxxxxxxx`**`/workers` — এই ID |

2. কোড push করুন:

```powershell
cd "C:\Users\AH NUHSAD\RAVEN"
git add .
git commit -m "Cloudflare Pages deploy"
git push
```

3. GitHub → **Actions** → **Deploy to Cloudflare Pages** → সবুজ টিক

### উপায় B — Windows PowerShell (আপনার PC)

```powershell
cd "C:\Users\AH NUHSAD\RAVEN"
powershell -ExecutionPolicy Bypass -File scripts\deploy-cloudflare.ps1
```

প্রথমবার Node.js লাগবে: https://nodejs.org/

### উপায় C — Connect to Git (Cloudflare dashboard)

1. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Repo select → Build settings:
   - Build command: *(খালি)*
   - Build output: `.`
3. Deploy

---

## ধাপ ৫ — Domain (ahnuhad.site)

1. **Pages → ahnuhad → Custom domains**
2. **Set up a custom domain** → `ahnuhad.site`
3. DNS Cloudflare-এ থাকলে automatic; না থাকলে CNAME যোগ করুন

---

## ধাপ ৬ — টেস্ট

1. https://ahnuhad.site → **Register** (অন্য ফোন থেকেও try করুন)
2. **Admin** → Customers → **Refresh** → password সহ user দেখা
3. OTP মেইল inbox/spam চেক

---

## সমস্যা সমাধান

| সমস্যা | সমাধান |
|--------|--------|
| Upload warning / wrangler | Manual upload বন্ধ; উপায় A/B/C ব্যবহার করুন |
| OTP যায় না | `BREVO_*` env + redeploy |
| Admin-এ user নেই | `RAVEN_KV` binding + `ADMIN_API_KEY` + admin logout/login |
| GitHub Pages vs Cloudflare | `ahnuhad.site` DNS যেটায় point করে সেটাই live — Cloudflare ব্যবহার করলে GH Pages বন্ধ করতে পারেন |

---

## ফাইল গাইড

| ফাইল | কাজ |
|------|-----|
| `wrangler.toml` | Cloudflare project config |
| `functions/api/send-otp.js` | OTP API |
| `functions/api/users.js` | Customer sync API |
| `package.json` | `npm run deploy` |
| `.github/workflows/cloudflare-pages.yml` | Auto deploy |

`.env` কখনো Git-এ push করবেন না।
