/**
 * Save/load customers from cloud (all devices → admin panel)
 */
const RavenCloudUsers = {
  isEnabled() {
    const c = typeof RAVEN_CLOUD !== 'undefined' ? RAVEN_CLOUD : {};
    if (!c.enabled) return false;
    if (c.provider === 'supabase') return !!(c.supabaseUrl && c.supabaseAnonKey);
    if (c.provider === 'api') return !!(c.usersApiUrl || this._apiUrlFromEmail());
    return false;
  },

  _apiUrlFromEmail() {
    const e = typeof RAVEN_EMAIL_CONFIG !== 'undefined' ? RAVEN_EMAIL_CONFIG : {};
    if (!e.apiUrl) return null;
    return String(e.apiUrl).replace(/\/?send-otp\/?$/, '/users');
  },

  getAdminKey() {
    const c = typeof RAVEN_CLOUD !== 'undefined' ? RAVEN_CLOUD : {};
    if (c.adminApiKey) return c.adminApiKey;
    if (typeof RAVEN_SEED !== 'undefined' && RAVEN_SEED.admin?.password) return RAVEN_SEED.admin.password;
    return sessionStorage.getItem('raven_admin_key') || '';
  },

  _normalize(user) {
    return {
      id: String(user.id || 'u-' + Date.now()),
      name: String(user.name || '').trim(),
      email: String(user.email || '')
        .trim()
        .toLowerCase(),
      phone: String(user.phone || '').trim(),
      password: String(user.password || ''),
      verified: !!user.verified,
      created_at: user.createdAt || user.created_at || new Date().toISOString(),
      orders: user.orders || [],
    };
  },

  _toLocal(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      password: row.password,
      verified: row.verified,
      createdAt: row.created_at || row.createdAt,
      orders: row.orders || [],
    };
  },

  async syncUser(user) {
    if (!this.isEnabled() || !user?.email) return { ok: false, skipped: true };
    const c = RAVEN_CLOUD;
    if (c.provider === 'supabase') return this._syncSupabase(user);
    return this._syncApi(user);
  },

  async fetchAll() {
    if (!this.isEnabled()) return { ok: false, users: [], message: 'Cloud not configured' };
    const c = RAVEN_CLOUD;
    if (c.provider === 'supabase') return this._fetchSupabase();
    return this._fetchApi();
  },

  mergeUserLists(localUsers, remoteUsers) {
    const map = new Map();
    (localUsers || []).forEach((u) => map.set(u.email.toLowerCase(), { ...u }));
    (remoteUsers || []).forEach((u) => {
      const email = u.email.toLowerCase();
      const existing = map.get(email);
      map.set(
        email,
        existing
          ? { ...existing, ...u, orders: u.orders?.length ? u.orders : existing.orders }
          : { ...u }
      );
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async emailExistsInCloud(email) {
    if (!this.isEnabled() || RAVEN_CLOUD.provider !== 'supabase') return false;
    const res = await this.fetchAll();
    if (!res.ok) return false;
    return res.users.some((u) => u.email === String(email).toLowerCase());
  },

  persistToLocalDb(users) {
    (users || []).forEach((u) => {
      if (u?.email) RavenDB.saveUser(u);
    });
  },

  async _syncSupabase(user) {
    const c = RAVEN_CLOUD;
    const row = this._normalize(user);
    const url = `${c.supabaseUrl.replace(/\/$/, '')}/rest/v1/raven_users?on_conflict=email`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: c.supabaseAnonKey,
          Authorization: `Bearer ${c.supabaseAnonKey}`,
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(row),
      });
      if (!res.ok) {
        const err = await res.text();
        console.warn('[RAVEN Cloud]', err);
        return { ok: false, message: 'Supabase save failed' };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  },

  async _fetchSupabase() {
    const c = RAVEN_CLOUD;
    const url = `${c.supabaseUrl.replace(/\/$/, '')}/rest/v1/raven_users?select=*&order=created_at.desc`;
    try {
      const res = await fetch(url, {
        headers: {
          apikey: c.supabaseAnonKey,
          Authorization: `Bearer ${c.supabaseAnonKey}`,
        },
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        return { ok: false, users: [], message: typeof data === 'object' ? data.message : 'Supabase error' };
      }
      const users = (Array.isArray(data) ? data : []).map((r) => this._toLocal(r));
      return { ok: true, users };
    } catch (e) {
      return { ok: false, users: [], message: e.message };
    }
  },

  async _syncApi(user) {
    const url = RAVEN_CLOUD.usersApiUrl || this._apiUrlFromEmail();
    if (!url) return { ok: false, message: 'No API URL' };
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
      if (!res.ok) return { ok: false, message: data.message || res.status };
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  },

  async _fetchApi() {
    const url = RAVEN_CLOUD.usersApiUrl || this._apiUrlFromEmail();
    if (!url) return { ok: false, users: [], message: 'No API URL' };
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'X-Admin-Key': this.getAdminKey() },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, users: [], message: data.message || res.status };
      return { ok: true, users: data.users || [] };
    } catch (e) {
      return { ok: false, users: [], message: e.message };
    }
  },
};
