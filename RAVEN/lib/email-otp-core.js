/**
 * Shared Brevo OTP logic (Cloudflare Pages Functions / Workers)
 */
function getAllowedOrigins(env) {
  const raw = env.ALLOWED_ORIGINS || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(origin, env) {
  const allowed = getAllowedOrigins(env);
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (allowed.length === 0) {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }
  return headers;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function jsonResponse(data, status, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

export async function handleSendOtpRequest(request, env) {
  const origin = request.headers.get('Origin') || '';
  const cors = corsHeaders(origin, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405, cors);
  }

  const allowed = getAllowedOrigins(env);
  if (allowed.length > 0 && (!origin || !allowed.includes(origin))) {
    return jsonResponse({ ok: false, message: 'Origin not allowed' }, 403, cors);
  }

  const apiKey = env.BREVO_API_KEY;
  const senderEmail = env.BREVO_SENDER_EMAIL;
  const senderName = env.BREVO_SENDER_NAME || 'RAVEN';

  if (!apiKey || !senderEmail) {
    return jsonResponse(
      {
        ok: false,
        message: 'Server email is not configured (BREVO_API_KEY, BREVO_SENDER_EMAIL).',
      },
      500,
      cors
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid JSON body.' }, 400, cors);
  }

  const toEmail = String(body.toEmail || '')
    .trim()
    .toLowerCase();
  const otp = String(body.otp || '').trim();
  const userName = String(body.userName || 'Customer').trim() || 'Customer';

  if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return jsonResponse({ ok: false, message: 'Valid email is required.' }, 400, cors);
  }

  if (!/^\d{6}$/.test(otp)) {
    return jsonResponse({ ok: false, message: 'Valid 6-digit OTP is required.' }, 400, cors);
  }

  const safeName = escapeHtml(userName);
  const safeOtp = escapeHtml(otp);

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: toEmail, name: userName }],
    subject: 'RAVEN — Your verification code',
    htmlContent: `<p>Hello ${safeName},</p>
<p>Your RAVEN verification code is:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:0.2em">${safeOtp}</p>
<p>This code expires in 5 minutes.</p>
<p>— ${escapeHtml(senderName)}</p>`,
    textContent: `Hello ${userName},\n\nYour RAVEN verification code is: ${otp}\n\nThis code expires in 5 minutes.\n\n— ${senderName}`,
  };

  const templateId = Number(env.BREVO_TEMPLATE_ID);
  if (templateId > 0) {
    payload.templateId = templateId;
    payload.params = {
      user_name: userName,
      otp,
      passcode: otp,
      verification_code: otp,
      site_name: 'RAVEN',
    };
    delete payload.htmlContent;
    delete payload.textContent;
    delete payload.subject;
  }

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!brevoRes.ok) {
      const errBody = await brevoRes.json().catch(() => ({}));
      const message = errBody?.message || `Brevo error (${brevoRes.status})`;
      console.error('[RAVEN Brevo]', brevoRes.status, errBody);
      return jsonResponse({ ok: false, message }, 502, cors);
    }

    return jsonResponse({ ok: true, message: 'OTP sent to your email.' }, 200, cors);
  } catch (err) {
    console.error('[RAVEN Brevo]', err);
    return jsonResponse({ ok: false, message: 'Could not send email. Try again.' }, 500, cors);
  }
}
