/**
 * Cross-device customers — choose ONE provider
 *
 * A) supabase (recommended — works with GitHub Pages, no Worker route)
 * B) api — Cloudflare Worker /api/users + KV (see FIX-NOW.md)
 */
const RAVEN_CLOUD = {
  enabled: true,

  /** 'supabase' | 'api' */
  provider: 'supabase',

  /* --- Supabase (required for all devices) — see SUPABASE-SETUP.md --- */
  supabaseUrl: 'https://unibhpcybywpffntuvxd.supabase.co',
  supabaseAnonKey: 'sb_publishable_W9RZS1J9Kkp6x2BSfnmy9Q_J7HEAqii',

  /* --- Cloudflare API (if provider is 'api') --- */
  usersApiUrl: '/api/users',
  adminApiKey: 'Raven@Admin2026',
};
