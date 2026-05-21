# RAVEN — GitHub Pages Deploy (বাংলা + English)

## কেন কাজ করছিল না?

1. **ভুল URL** — Repo নাম `RAVEN` হলে সাইট: `https://USERNAME.github.io/RAVEN/` (শেষে `/` দিন)
2. **Pages সোর্স ভুল** — “Deploy from branch” নয়, **GitHub Actions** সিলেক্ট করুন
3. **ভুল ফোল্ডার আপলোড** — `index.html` অবশ্যই repo-র **মূলে** থাকতে হবে
4. **CSS/JS লোড না হওয়া** — project site-এ base path ঠিক করা হয়েছে (স্বয়ংক্রিয়)

---

## ধাপে ধাপে (একবার করুন)

### ১. GitHub-এ repo

- নতুন repository (যেমন: `RAVEN`)
- README/License যোগ করবেন না (খালি repo ভালো)

### ২. পুরো ফোল্ডার push করুন

Windows PowerShell:

```powershell
cd "C:\Users\AH NUHSAD\RAVEN"
git add .
git commit -m "Fix GitHub Pages deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/RAVEN.git
git push -u origin main
```

(`origin` থাকলে শুধু: `git push`)

### ৩. GitHub Settings

**A) Pages**

- `Settings` → `Pages`
- **Build and deployment** → Source: **GitHub Actions**

**B) Actions permission**

- `Settings` → `Actions` → `General`
- **Workflow permissions** → **Read and write permissions**
- Save

### ৪. Workflow চালান

- `Actions` ট্যাব → **Deploy to GitHub Pages**
- সবুজ টিক ✅ হলে **View deployment** বা নিচের URL খুলুন

### ৫. সঠিক লিংক

```
https://YOUR_USERNAME.github.io/RAVEN/
```

উদাহরণ: `https://johndoe.github.io/RAVEN/`

---

## এখনও সমস্যা?

| লক্ষণ | সমাধান |
|--------|--------|
| 404 | `index.html` repo root-এ আছে কিনা GitHub-এ দেখুন |
| Actions লাল | Actions ট্যাবে error মেসেজ পড়ুন |
| পেজ খালি / স্টাইল নেই | URL-এ `/RAVEN/` ব্যবহার করুন, cache clear |
| Workflow দেখা যায় না | `.github/workflows/deploy-pages.yml` push হয়েছে কিনা চেক করুন |

---

## Admin

- URL: `https://YOUR_USERNAME.github.io/RAVEN/admin/admin-login.html`
- Email: `mdnuhad534@gmail.com`
- Password: `Raven@Admin2026`
