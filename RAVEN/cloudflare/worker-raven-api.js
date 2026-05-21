/**
 * RAVEN API — paste into Cloudflare Dashboard → Workers → Create Worker
 * Route: ahnuhad.site/api/*  (zone ahnuhad.site)
 * Bindings: KV namespace RAVEN_KV | Vars: BREVO_*, ADMIN_API_KEY, ALLOWED_ORIGINS
 */
const USERS_KV_KEY = 'raven_users_v1';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/send-otp') {
      return handleSendOtp(request, env);
    }
    if (url.pathname === '/api/users') {
      return handleUsers(request, env);
    }
    return json({ ok: false, message: 'Not found' }, 404);
  },
};

function getAllowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function apiCors(request, env, methods = 'GET, POST, OPTIONS') {
  const origin = request.headers.get('Origin') || '';
  const allowed = getAllowedOrigins(env);
  const headers = {
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  };
  if (allowed.length === 0) {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  } else if (allowed.length > 0) {
    headers['Access-Control-Allow-Origin'] = allowed[0];
  }
  return headers;
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function handleSendOtp(request, env) {
  const cors = apiCors(request, env, 'POST, OPTIONS');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return json({ ok: false, message: 'Method not allowed' }, 405, cors);

  const allowed = getAllowedOrigins(env);
  const origin = request.headers.get('Origin') || '';
  if (allowed.length > 0 && origin && !allowed.includes(origin)) {
    return json({ ok: false, message: 'Origin not allowed' }, 403, cors);
  }

  const apiKey = env.BREVO_API_KEY;
  const senderEmail = env.BREVO_SENDER_EMAIL;
  const senderName = env.BREVO_SENDER_NAME || 'RAVEN';
  if (!apiKey || !senderEmail) {
    return json({ ok: false, message: 'BREVO_API_KEY or BREVO_SENDER_EMAIL missing in Worker' }, 500, cors);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: 'Invalid JSON' }, 400, cors);
  }

  const toEmail = String(body.toEmail || '')
    .trim()
    .toLowerCase();
  const otp = String(body.otp || '').trim();
  const userName = String(body.userName || 'Customer').trim() || 'Customer';

  if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return json({ ok: false, message: 'Valid email required' }, 400, cors);
  }
  if (!/^\d{6}$/.test(otp)) {
    return json({ ok: false, message: 'Valid 6-digit OTP required' }, 400, cors);
  }

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: toEmail, name: userName }],
    subject: 'RAVEN — Your verification code',
    htmlContent: `<p>Hello ${escapeHtml(userName)},</p><p>Your code:</p><p style="font-size:24px;font-weight:bold">${escapeHtml(otp)}</p><p>Expires in 5 minutes.</p>`,
    textContent: `Your RAVEN code: ${otp}`,
  };

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { accept: 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!brevoRes.ok) {
      const err = await brevoRes.json().catch(() => ({}));
      return json({ ok: false, message: err.message || 'Brevo error' }, 502, cors);
    }
    return json({ ok: true, message: 'OTP sent to your email.' }, 200, cors);
  } catch (e) {
    return json({ ok: false, message: 'Could not send email' }, 500, cors);
  }
}

async function handleUsers(request, env) {
  const cors = apiCors(request, env, 'GET, POST, OPTIONS');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  if (!env.RAVEN_KV) {
    return json({ ok: false, message: 'RAVEN_KV not bound to Worker' }, 503, cors);
  }

  if (request.method === 'GET') {
    const key = request.headers.get('X-Admin-Key') || '';
    if (!env.ADMIN_API_KEY || key !== env.ADMIN_API_KEY) {
      return json({ ok: false, message: 'Unauthorized' }, 401, cors);
    }
    const raw = await env.RAVEN_KV.get(USERS_KV_KEY);
    const users = raw ? JSON.parse(raw) : [];
    return json({ ok: true, users: Array.isArray(users) ? users : [] }, 200, cors);
  }

  if (request.method === 'POST') {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, message: 'Invalid JSON' }, 400, cors);
    }
    const user = body.user;
    if (!user?.email) return json({ ok: false, message: 'Missing user' }, 400, cors);

    const raw = await env.RAVEN_KV.get(USERS_KV_KEY);
    const users = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(users) ? users : [];
    const email = String(user.email).trim().toLowerCase();
    const next = {
      id: String(user.id || 'u-' + Date.now()),
      name: String(user.name || '').trim(),
      email,
      phone: String(user.phone || '').trim(),
      password: String(user.password || ''),
      verified: !!user.verified,
      createdAt: user.createdAt || new Date().toISOString(),
      orders: user.orders || [],
      lastSyncAt: new Date().toISOString(),
    };
    const idx = list.findIndex((u) => u.email === email);
    if (idx >= 0) list[idx] = { ...list[idx], ...next };
    else list.push(next);
    await env.RAVEN_KV.put(USERS_KV_KEY, JSON.stringify(list));
    return json({ ok: true, user: next }, 200, cors);
  }

  return json({ ok: false, message: 'Method not allowed' }, 405, cors);
}
