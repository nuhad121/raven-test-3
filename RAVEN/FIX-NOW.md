# কাজ করছে না — এখনই ঠিক করুন (ahnuhad.site)

## সমস্যা কী ছিল?

1. **লাইভ সাইটে পুরনো কোড** — এখনো EmailJS; নতুন Brevo/Cloudflare কোড GitHub-এ push হয়নি  
2. **`/api/send-otp` ও `/api/users` নেই** — তাই OTP মেইল + admin user list কাজ করে না  

---

## ধাপ ১ — নতুন সাইট ফাইল push করুন (৫ মিনিট)

PowerShell:

```powershell
cd "C:\Users\AH NUHSAD\RAVEN"
git add .
git commit -m "Brevo OTP, admin users, Cloudflare API"
git push
```

GitHub → **Actions** → **Deploy to GitHub Pages** সবুজ হতে ২–৩ মিনিট অপেক্ষা করুন।

তারপর ব্রাউজারে hard refresh: `Ctrl + Shift + R`  
চেক: https://ahnuhad.site/js/email-config.js — এতে `apiUrl: '/api/send-otp'` থাকতে হবে (EmailJS নয়)।

---

## ধাপ ২ — Cloudflare Worker (API চালু)

Manual upload নয়। **Worker** দিয়ে `/api/*` চালু করুন:

### A) Worker তৈরি

1. https://dash.cloudflare.com/ → **Workers & Pages** → **Create** → **Create Worker**  
2. নাম: `raven-api`  
3. **Edit code** — সব কোড মুছে ফাইল থেকে কপি করুন:  
   **`cloudflare/worker-raven-api.js`** (পুরো ফাইল)  
4. **Save and deploy**

### B) Variables (Worker → Settings → Variables)

| Name | Value |
|------|--------|
| `BREVO_API_KEY` | আপনার Brevo key |
| `BREVO_SENDER_EMAIL` | `mdnuhad534@gmail.com` |
| `BREVO_SENDER_NAME` | `RAVEN` |
| `ADMIN_API_KEY` | `Raven@Admin2026` |
| `ALLOWED_ORIGINS` | `https://ahnuhad.site,https://www.ahnuhad.site` |

### C) KV bind

1. **KV** → Create namespace `raven-users`  
2. Worker **raven-api** → **Settings** → **Bindings** → **KV**  
   - Variable: `RAVEN_KV`  
   - Namespace: `raven-users`  
3. **Deploy** again

### D) Route যোগ করুন (গুরুত্বপূর্ণ)

1. **Workers & Pages** → **raven-api** → **Settings** → **Triggers** → **Routes** → **Add route**  
2. Route: `ahnuhad.site/api/*`  
3. Zone: `ahnuhad.site`  
4. Save

---

## ধাপ ৩ — টেস্ট

1. Register → OTP মেইল (বা OTP পেজে হলুদ backup code)  
2. Admin login → Customers → **Refresh** → user + password  

API টেস্ট (PowerShell):

```powershell
Invoke-RestMethod -Uri "https://ahnuhad.site/api/send-otp" -Method POST -ContentType "application/json" -Body '{"toEmail":"mdnuhad534@gmail.com","otp":"123456","userName":"Test"}'
```

`ok : True` আসলে API ঠিক।

---

## এখনও না হলে

| লক্ষণ | করণীয় |
|--------|--------|
| email-config.js এখনো EmailJS | git push হয়নি বা cache — Ctrl+Shift+R |
| API 404 | Worker route `ahnuhad.site/api/*` যোগ করুন |
| API 500 Brevo | Worker variables চেক করুন |
| Admin user খালি | KV `RAVEN_KV` + admin logout/login + Refresh |
