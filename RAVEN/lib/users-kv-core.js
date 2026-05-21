/**
 * Cloudflare KV — shared user list (all devices)
 */
const USERS_KV_KEY = 'raven_users_v1';

export async function readUsersFromKV(env) {
  if (!env.RAVEN_KV) return null;
  try {
    const raw = await env.RAVEN_KV.get(USERS_KV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[RAVEN KV read]', err);
    return [];
  }
}

export async function writeUsersToKV(env, users) {
  if (!env.RAVEN_KV) return false;
  await env.RAVEN_KV.put(USERS_KV_KEY, JSON.stringify(users));
  return true;
}

export function sanitizeUserForStore(user) {
  return {
    id: String(user.id || 'u-' + Date.now()),
    name: String(user.name || '').trim(),
    email: String(user.email || '')
      .trim()
      .toLowerCase(),
    phone: String(user.phone || '').trim(),
    password: String(user.password || ''),
    verified: !!user.verified,
    createdAt: user.createdAt || new Date().toISOString(),
    orders: Array.isArray(user.orders) ? user.orders : [],
    lastSyncAt: new Date().toISOString(),
  };
}

export async function upsertUserInKV(env, user) {
  const next = sanitizeUserForStore(user);
  if (!next.email) return { ok: false, message: 'Email is required.' };

  const users = (await readUsersFromKV(env)) ?? [];
  const idx = users.findIndex((u) => u.email === next.email);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...next, createdAt: users[idx].createdAt || next.createdAt };
  } else {
    users.push(next);
  }
  users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  await writeUsersToKV(env, users);
  return { ok: true, user: next };
}

export function checkAdminKey(request, env) {
  const key = request.headers.get('X-Admin-Key') || '';
  const expected = env.ADMIN_API_KEY || '';
  return expected && key === expected;
}
