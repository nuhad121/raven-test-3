/**
 * Cloudflare — GET /api/users (admin), POST /api/users (sync from any device)
 */
import {
  checkAdminKey,
  readUsersFromKV,
  upsertUserInKV,
} from '../../lib/users-kv-core.js';

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (!env.RAVEN_KV) {
    return json(
      {
        ok: false,
        message: 'RAVEN_KV is not bound. Add KV in Cloudflare Pages → Settings → Bindings.',
      },
      503
    );
  }

  if (request.method === 'GET') {
    if (!checkAdminKey(request, env)) {
      return json({ ok: false, message: 'Unauthorized' }, 401);
    }
    const users = await readUsersFromKV(env);
    return json({ ok: true, users: users || [] });
  }

  if (request.method === 'POST') {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, message: 'Invalid JSON' }, 400);
    }
    if (!body.user) {
      return json({ ok: false, message: 'Missing user object' }, 400);
    }
    const result = await upsertUserInKV(env, body.user);
    if (!result.ok) return json(result, 400);
    return json({ ok: true, user: result.user });
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
      },
    });
  }

  return json({ ok: false, message: 'Method not allowed' }, 405);
}
