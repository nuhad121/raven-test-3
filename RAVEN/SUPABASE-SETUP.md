# সব ডিভাইসের customer admin-এ দেখানো (Supabase)

## কেন অন্য ডিভাইসের account দেখা যায় না?

প্রতিটি ফোন/PC-র **নিজের ব্রাউজার memory (localStorage)**-এ user সেভ হয়।  
আপনার laptop-এর admin শুধু **laptop-এর** data দেখে — অন্য ফোনের data সেখানে যায় না।

**সমাধান:** Supabase (ফ্রি cloud) — register হলে সব ডিভাইস থেকে cloud-এ যাবে, admin সেখান থেকে পড়বে।

---

## ১. Supabase account

1. https://supabase.com → Sign up (free)
2. **New project** → নাম: `raven` → password সেভ করুন
3. প্রজেক্ট তৈরি হতে ১–২ মিনিট অপেক্ষা

## ২. Database table

1. বামে **SQL Editor** → **New query**
2. ফাইল খুলুন: `supabase/schema.sql` → সব কপি → paste → **Run**

## ৩. API keys

1. **Project Settings** (গিয়ার) → **API**
2. কপি করুন:
   - **Project URL** (যেমন `https://xxxxx.supabase.co`)
   - **anon public** key (`eyJ...`)

## ৪. RAVEN project-এ বসান

ফাইল: `js/cloud-config.js`

```javascript
const RAVEN_CLOUD = {
  enabled: true,
  provider: 'supabase',
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_KEY',
  usersApiUrl: '/api/users',
  adminApiKey: 'Raven@Admin2026',
};
```

## ৫. GitHub-এ push

```powershell
cd "C:\Users\AH NUHSAD\RAVEN"
git add .
git commit -m "Cloud customer sync via Supabase"
git push
```

## ৬. টেস্ট

1. **অন্য ফোন** থেকে Register + OTP verify
2. Admin → **Customers** → **Refresh**
3. সেই user + password দেখা উচিত

---

## সমস্যা

| সমস্যা | সমাধান |
|--------|--------|
| Admin খালি | `cloud-config.js` URL/key ঠিক? `schema.sql` run করেছেন? |
| Supabase error | Table `raven_users` আছে কিনা Table Editor-এ দেখুন |
| শুধু এই PC-র user | Push হয়নি — live সাইটে নতুন JS লোড হয়েছে কিনা চেক করুন |
