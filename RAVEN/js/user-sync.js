/**
 * Sync customers to Cloudflare KV (all devices → one admin list)
 */
const RavenUserSync = {
  getUsersApiUrl() {
    const c = typeof RAVEN_EMAIL_CONFIG !== 'undefined' ? RAVEN_EMAIL_CONFIG : {};
    if (!c.enabled || !c.apiUrl) return null;
    if (c.usersApiUrl) return c.usersApiUrl;
    return String(c.apiUrl).replace(/\/?send-otp\/?$/, '/users');
  },

  isEnabled() {
    return !!this.getUsersApiUrl();
  },

  async syncUser(user) {
    const url = this.getUsersApiUrl();
    if (!url || !user?.email) return { ok: false, skipped: true };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            password: user.password,
            verified: user.verified,
            createdAt: user.createdAt,
            orders: user.orders || [],
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.warn('[RAVEN UserSync]', data.message || res.status);
        return { ok: false, message: data.message };
      }
      return { ok: true };
    } catch (err) {
      console.warn('[RAVEN UserSync]', err);
      return { ok: false, message: err.message };
    }
  },

  async fetchAllForAdmin(adminKey) {
    const url = this.getUsersApiUrl();
    if (!url) return { ok: false, users: [], message: 'User sync not configured' };

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'X-Admin-Key': adminKey || '' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, users: [], message: data.message || 'Could not load users' };
      }
      return { ok: true, users: data.users || [] };
    } catch (err) {
      return { ok: false, users: [], message: err.message };
    }
  },

  mergeUserLists(localUsers, remoteUsers) {
    const map = new Map();
    (localUsers || []).forEach((u) => map.set(u.email.toLowerCase(), { ...u }));
    (remoteUsers || []).forEach((u) => {
      const email = u.email.toLowerCase();
      const existing = map.get(email);
      map.set(email, existing ? { ...existing, ...u, orders: u.orders?.length ? u.orders : existing.orders } : { ...u });
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
};
