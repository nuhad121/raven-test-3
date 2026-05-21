/**
 * RAVEN — Send OTP via Brevo (server-side only; API key stays in env vars).
 * Deploy with Vercel: https://vercel.com/docs/functions/serverless-functions
 */
function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function setCors(res, origin) {
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';

  if (req.method === 'OPTIONS') {
    setCors(res, origin);
    return res.status(204).end();
  }

  setCors(res, origin);

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const allowed = getAllowedOrigins();
  if (allowed.length > 0 && (!origin || !allowed.includes(origin))) {
    return res.status(403).json({ ok: false, message: 'Origin not allowed' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'RAVEN';

  if (!apiKey || !senderEmail) {
    return res.status(500).json({
      ok: false,
      message: 'Server email is not configured (BREVO_API_KEY, BREVO_SENDER_EMAIL).',
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const toEmail = String(body.toEmail || '')
    .trim()
    .toLowerCase();
  const otp = String(body.otp || '').trim();
  const userName = String(body.userName || 'Customer').trim() || 'Customer';

  if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return res.status(400).json({ ok: false, message: 'Valid email is required.' });
  }

  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ ok: false, message: 'Valid 6-digit OTP is required.' });
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

  const templateId = Number(process.env.BREVO_TEMPLATE_ID);
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
      return res.status(502).json({ ok: false, message });
    }

    return res.status(200).json({ ok: true, message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('[RAVEN Brevo]', err);
    return res.status(500).json({ ok: false, message: 'Could not send email. Try again.' });
  }
};
