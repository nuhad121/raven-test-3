# RAVEN — ইমেইলে OTP পাঠানো (Brevo)

Static সাইটে **Brevo API key** সরাসরি ব্রাউজারে রাখা যায় না (চুরি হতে পারে)। তাই ছোট একটি **serverless API** (Vercel, ফ্রি) দিয়ে মেইল পাঠানো হয়; সাইট GitHub Pages-এ থাকতে পারে।

## ১. Brevo account

1. যান: https://www.brevo.com/ → **Sign up** (ফ্রি plan আছে)
2. **Senders & IP** → **Senders** → আপনার email/domain **verify** করুন
3. **SMTP & API** → **API Keys** → নতুন key তৈরি করুন → কপি করুন

## ২. Vercel-এ API deploy

1. https://vercel.com/ → GitHub দিয়ে login
2. **Add New Project** → আপনার `RAVEN` repo import করুন
3. **Environment Variables** (Production):

| Name | Value |
|------|--------|
| `BREVO_API_KEY` | Brevo API key |
| `BREVO_SENDER_EMAIL` | Verified sender (যেমন `noreply@yourdomain.com`) |
| `BREVO_SENDER_NAME` | `RAVEN` (optional) |
| `ALLOWED_ORIGINS` | `https://YOUR_USERNAME.github.io` (comma-separated; local test: `http://localhost:5500`) |

4. Deploy করুন
5. API URL নোট করুন, যেমন:  
   `https://raven-xxxx.vercel.app/api/send-otp`

### Optional: Brevo template

1. Brevo → **Templates** → transactional template বানান
2. Variables: `{{ params.user_name }}`, `{{ params.otp }}`
3. Vercel env-এ `BREVO_TEMPLATE_ID=123` (template ID) যোগ করুন

## ৩. RAVEN frontend config

ফাইল: `js/email-config.js`

```javascript
const RAVEN_EMAIL_CONFIG = {
  enabled: true,
  apiUrl: 'https://YOUR_VERCEL_PROJECT.vercel.app/api/send-otp',
};
```

GitHub Pages-এ push করুন।

## ৪. টেস্ট

1. **Register** করুন আসল email দিয়ে
2. Inbox + Spam চেক করুন
3. `otp.html`-এ ৬ অঙ্কের code দিন

Email fail হলে OTP পেজে **হলুদ বক্সে** backup code দেখাবে।

## Local test (optional)

```powershell
cd "C:\Users\AH NUHSAD\RAVEN"
copy .env.example .env
# Edit .env with your Brevo keys
npx vercel dev
```

`email-config.js`-এ `apiUrl`: `http://localhost:3000/api/send-otp`  
`ALLOWED_ORIGINS`-এ `http://localhost:5500` বা যে port-এ HTML খুলছেন।

## সীমা ও নিরাপত্তা

- Brevo free tier: দৈনিক/মাসিক limit — dashboard-এ দেখুন
- **কখনো** `BREVO_API_KEY` `email-config.js`-এ রাখবেন না
- Production-এ `ALLOWED_ORIGINS` অবশ্যই সেট করুন
- পুরনো EmailJS key আর ব্যবহার হয় না — repo থেকে সরানো হয়েছে

## EmailJS থেকে পার্থক্য

| | EmailJS | Brevo |
|---|---------|--------|
| Key location | Browser (public key) | Server only (Verco env) |
| Hosting | শুধু static | Static site + Vercel API |
| Deliverability | ভালো | সাধারণত ভালো (transactional) |
