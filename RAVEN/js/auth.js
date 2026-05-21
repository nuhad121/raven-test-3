/**
 * RAVEN - Frontend auth simulation
 */
const RavenAuth = {
  init() {
    RavenDB.init();
  },

  getSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION));
    } catch {
      return null;
    }
  },

  setSession(user) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  isLoggedIn() {
    return !!this.getSession();
  },

  getCurrentUser() {
    const session = this.getSession();
    if (!session) return null;
    const users = RavenDB.getUsers();
    return users.find((u) => u.id === session.id) || session;
  },

  async register({ name, email, phone, password }) {
    const db = RavenDB.init();
    const emailLower = email.toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === emailLower)) {
      return { ok: false, message: 'Email already registered.' };
    }
    if (typeof RavenCloudUsers !== 'undefined' && RavenCloudUsers.isEnabled()) {
      const exists = await RavenCloudUsers.emailExistsInCloud(emailLower);
      if (exists) return { ok: false, message: 'Email already registered on another device.' };
    }
    const user = {
      id: 'u-' + Date.now(),
      name,
      email: email.toLowerCase(),
      phone,
      password,
      verified: false,
      createdAt: new Date().toISOString(),
      orders: [],
    };
    RavenDB.saveUser(user);
    let cloudSynced = false;
    if (typeof RavenCloudUsers !== 'undefined' && RavenCloudUsers.isEnabled()) {
      const cloud = await RavenCloudUsers.syncUser(user);
      cloudSynced = cloud.ok;
    }
    const mail = await this.generateOTP(email, 'register', name);
    sessionStorage.setItem('raven_pending_email', email.toLowerCase());
    return {
      ok: true,
      user,
      emailSent: mail.emailSent,
      emailMessage: mail.message,
      cloudSynced,
    };
  },

  async login(email, password) {
    const users = RavenDB.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      return { ok: false, message: 'Invalid email or password.' };
    }
    if (!user.verified) {
      const mail = await this.generateOTP(email, 'login', user.name);
      sessionStorage.setItem('raven_pending_email', email.toLowerCase());
      return {
        ok: false,
        needsOtp: true,
        emailSent: mail.emailSent,
        emailMessage: mail.message,
        message: mail.emailSent
          ? 'Verification code sent to your email.'
          : 'Please verify with the code shown on the next page.',
      };
    }
    this.setSession({ id: user.id, name: user.name, email: user.email });
    if (typeof RavenCloudUsers !== 'undefined') {
      await RavenCloudUsers.syncUser(user);
    }
    return { ok: true, user };
  },

  async generateOTP(email, purpose = 'verify', userName = '') {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const meta = { email: email.toLowerCase(), purpose, createdAt: Date.now(), expiresIn: 300 };
    localStorage.setItem(STORAGE_KEYS.OTP, otp);
    localStorage.setItem(STORAGE_KEYS.OTP_META, JSON.stringify(meta));

    let emailSent = false;
    let message = '';

    if (typeof RavenEmail !== 'undefined') {
      const result = await RavenEmail.sendOtp(email, otp, userName);
      emailSent = result.ok;
      message = result.message || '';
      if (!result.ok) {
        console.warn('[RAVEN OTP] Email not sent to', email, '—', result.message);
      }
    } else {
      message = 'Email service not loaded.';
    }

    sessionStorage.setItem('raven_otp_email_sent', emailSent ? '1' : '0');
    return { otp, emailSent, message };
  },

  /** Demo only — no real email is sent (static site, no server). */
  getDemoOTP(email) {
    const meta = JSON.parse(localStorage.getItem(STORAGE_KEYS.OTP_META) || '{}');
    const stored = localStorage.getItem(STORAGE_KEYS.OTP);
    if (!stored || meta.email?.toLowerCase() !== email?.toLowerCase()) return null;
    if (this.getOTPRemaining() <= 0) return null;
    return stored;
  },

  getOTPRemaining() {
    try {
      const meta = JSON.parse(localStorage.getItem(STORAGE_KEYS.OTP_META));
      if (!meta) return 0;
      const elapsed = Math.floor((Date.now() - meta.createdAt) / 1000);
      return Math.max(0, meta.expiresIn - elapsed);
    } catch {
      return 0;
    }
  },

  verifyOTP(email, inputOtp) {
    const stored = localStorage.getItem(STORAGE_KEYS.OTP);
    const meta = JSON.parse(localStorage.getItem(STORAGE_KEYS.OTP_META) || '{}');
    if (!stored || meta.email?.toLowerCase() !== email.toLowerCase()) {
      return { ok: false, message: 'OTP expired. Please resend.' };
    }
    if (this.getOTPRemaining() <= 0) {
      return { ok: false, message: 'OTP expired. Please resend.' };
    }
    if (stored !== inputOtp.trim()) {
      return { ok: false, message: 'Invalid OTP. Try again.' };
    }
    const users = RavenDB.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      user.verified = true;
      RavenDB.saveUser(user);
      if (typeof RavenCloudUsers !== 'undefined' && RavenCloudUsers.isEnabled()) {
        RavenCloudUsers.syncUser(user);
      }
      this.setSession({ id: user.id, name: user.name, email: user.email });
    }
    localStorage.removeItem(STORAGE_KEYS.OTP);
    localStorage.removeItem(STORAGE_KEYS.OTP_META);
    return { ok: true };
  },

  async resendOTP(email) {
    const user = RavenDB.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
    const mail = await this.generateOTP(email, 'resend', user?.name || '');
    return { ok: true, emailSent: mail.emailSent, message: mail.message };
  },

  async resetPasswordRequest(email) {
    const user = RavenDB.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { ok: false, message: 'No account found with this email.' };
    const mail = await this.generateOTP(email, 'reset', user.name);
    sessionStorage.setItem('raven_pending_email', email.toLowerCase());
    sessionStorage.setItem('raven_reset_flow', '1');
    return { ok: true, emailSent: mail.emailSent, message: mail.message };
  },

  resetPassword(email, newPassword) {
    const users = RavenDB.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { ok: false, message: 'User not found.' };
    user.password = newPassword;
    RavenDB.saveUser(user);
    if (typeof RavenCloudUsers !== 'undefined') {
      RavenCloudUsers.syncUser(user);
    }
    sessionStorage.removeItem('raven_reset_flow');
    return { ok: true };
  },

  logout() {
    this.clearSession();
    window.location.href = 'index.html';
  },

  requireAuth(redirectTo = 'login.html') {
    if (!this.isLoggedIn()) {
      window.location.href = redirectTo + '?redirect=' + encodeURIComponent(window.location.pathname.split('/').pop() + window.location.search);
      return false;
    }
    return true;
  },

  /* Admin */
  getAdminSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION));
    } catch {
      return null;
    }
  },

  adminLogin(email, password) {
    const adminEmail = RAVEN_SEED.admin.email.toLowerCase();
    if (email.toLowerCase() !== adminEmail || password !== RAVEN_SEED.admin.password) {
      return { ok: false, message: 'Unauthorized. Admin access only.' };
    }
    const session = { email: adminEmail, role: 'admin', loginAt: Date.now() };
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
    sessionStorage.setItem('raven_admin_key', password);
    return { ok: true };
  },

  adminLogout() {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    sessionStorage.removeItem('raven_admin_key');
    window.location.href = 'admin-login.html';
  },

  requireAdmin() {
    const session = this.getAdminSession();
    if (!session || session.email !== RAVEN_SEED.admin.email.toLowerCase()) {
      const path = window.location.pathname;
      const inAdmin = path.includes('/admin/');
      window.location.href = (inAdmin ? '' : 'admin/') + 'admin-login.html';
      return false;
    }
    return true;
  },
};
