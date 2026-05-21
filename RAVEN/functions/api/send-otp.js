/**
 * Cloudflare Pages Function — POST /api/send-otp
 * https://developers.cloudflare.com/pages/functions/
 */
import { handleSendOtpRequest } from '../../lib/email-otp-core.js';

export async function onRequest(context) {
  return handleSendOtpRequest(context.request, context.env);
}
