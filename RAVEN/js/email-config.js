/**
 * RAVEN — OTP email
 * Primary: Brevo via /api/send-otp (Cloudflare Worker — see FIX-NOW.md)
 * Fallback: EmailJS (works until Worker is set up)
 */
const RAVEN_EMAIL_CONFIG = {
  enabled: true,
  apiUrl: '/api/send-otp',
  publicKey: 'c1rBvdttCHfuRTgor',
  serviceId: 'service_8okscjk',
  templateId: 'template_2jbzy8q',
};
