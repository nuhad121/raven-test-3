/**
 * RAVEN — Send OTP: Brevo (Cloudflare /api/send-otp) with EmailJS fallback
 */
const RavenEmail = {
  hasBrevo() {
    const c = typeof RAVEN_EMAIL_CONFIG !== 'undefined' ? RAVEN_EMAIL_CONFIG : {};
    return !!(c.enabled && c.apiUrl);
  },

  hasEmailJs() {
    const c = typeof RAVEN_EMAIL_CONFIG !== 'undefined' ? RAVEN_EMAIL_CONFIG : {};
    return !!(c.enabled && c.publicKey && c.serviceId && c.templateId);
  },

  isConfigured() {
    return this.hasBrevo() || this.hasEmailJs();
  },

  async sendOtp(toEmail, otp, userName = '') {
    const email = String(toEmail).trim().toLowerCase();
    if (!email) {
      return { ok: false, message: 'Email address is required.' };
    }

    if (!this.isConfigured()) {
      sessionStorage.removeItem('raven_otp_fallback');
      return { ok: false, message: 'Email is not configured on the server.' };
    }

    if (this.hasBrevo()) {
      const brevo = await this._sendBrevo(email, otp, userName);
      if (brevo.ok) {
        sessionStorage.removeItem('raven_otp_fallback');
        return brevo;
      }
      console.warn('[RAVEN Email] Brevo failed:', brevo.message);
      if (this.hasEmailJs()) {
        const ej = await this._sendEmailJs(email, otp, userName);
        if (ej.ok) {
          sessionStorage.removeItem('raven_otp_fallback');
          return ej;
        }
        return { ok: false, message: ej.message || brevo.message };
      }
      return brevo;
    }

    return this._sendEmailJs(email, otp, userName);
  },

  async _sendBrevo(email, otp, userName) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(RAVEN_EMAIL_CONFIG.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: email,
          otp,
          userName: userName || 'Customer',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        throw new Error(data.message || `Email API error (${response.status})`);
      }
      return { ok: true, message: data.message || 'OTP sent to your email.' };
    } catch (err) {
      const msg =
        err?.name === 'AbortError'
          ? 'Email request timed out. Try again.'
          : err?.message || 'Could not send email.';
      return { ok: false, message: msg };
    }
  },

  async _sendEmailJs(email, otp, userName) {
    if (typeof emailjs === 'undefined') {
      return { ok: false, message: 'EmailJS library not loaded.' };
    }
    try {
      emailjs.init({ publicKey: RAVEN_EMAIL_CONFIG.publicKey });
      const sendPromise = emailjs.send(RAVEN_EMAIL_CONFIG.serviceId, RAVEN_EMAIL_CONFIG.templateId, {
        to_email: email,
        email,
        user_email: email,
        otp,
        passcode: otp,
        verification_code: otp,
        user_name: userName || 'Customer',
        site_name: 'RAVEN',
        reply_to: email,
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email request timed out.')), 12000)
      );
      await Promise.race([sendPromise, timeoutPromise]);
      return { ok: true, message: 'OTP sent to your email.' };
    } catch (err) {
      console.error('[RAVEN EmailJS]', err);
      return { ok: false, message: err?.text || err?.message || 'Could not send email.' };
    }
  },
};
