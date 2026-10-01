const BASE = "https://guewvrivkucbhhlihwfk.supabase.co";
const KEY = "sb_publishable_1AnJ604R9CIGZC_xY9DBeQ_BIZeD64L";
const STORE = "archive-admin-session";

let session = null;
try {
  session = JSON.parse(sessionStorage.getItem(STORE) || "null");
} catch {
  sessionStorage.removeItem(STORE);
}

async function request(path, { method = "GET", body, auth = false, headers = {} } = {}) {
  const token = session?.access_token;
  if (auth && !token) throw new Error("ログインしてください。");

  const response = await fetch(BASE + path, {
    method,
    cache: "no-store",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${token || KEY}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const failure = new Error(
      error.message || error.error_description || error.msg || error.error ||
      `HTTP ${response.status}`
    );
    failure.status = response.status;
    failure.code = error.error_code || error.code || "";
    throw failure;
  }
  if (response.status === 204) return null;
  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
}

let adminGuard = null;
export function setAdminGuard(callback) { adminGuard = callback; }

export async function api(path, options = {}) {
  if (options.auth) {
    if (adminGuard) await adminGuard();
    if (!session?.access_token) {
      window.dispatchEvent(new Event('archive-admin-access-denied'));
      throw new Error('管理者権限がないため操作できません');
    }
    if (session.expires_at && session.expires_at * 1000 <= Date.now() + 30000) {
      if (!await refreshSession()) {
        window.dispatchEvent(new Event('archive-admin-access-denied'));
        throw new Error('管理者権限がないため操作できません');
      }
    }
    const token = session?.access_token;
    try {
      const allowed = await request('/rest/v1/rpc/is_archive_admin', { method: 'POST', body: {}, auth: true });
      if (allowed !== true || token !== session?.access_token) {
        const error = new Error('管理者権限がないため操作できません');
        error.status = 403;
        throw error;
      }
      if (adminGuard) await adminGuard();
      if (path === '/rest/v1/rpc/is_archive_admin') return true;
      return await request(path, options);
    } catch (error) {
      if (error.status === 401 || error.status === 403 || error.code === '42501') {
        window.dispatchEvent(new Event('archive-admin-access-denied'));
        throw new Error('管理者権限がないため操作できません');
      }
      throw error;
    }
  }
  return request(path, options);
}

export async function signIn(email, password) {
  session = await request("/auth/v1/token?grant_type=password", {
    method: "POST", body: { email, password }
  });
  sessionStorage.setItem(STORE, JSON.stringify(session));
  return session;
}

export async function refreshSession() {
  if (!session?.refresh_token) return false;
  try {
    session = await request("/auth/v1/token?grant_type=refresh_token", {
      method: "POST", body: { refresh_token: session.refresh_token }
    });
    sessionStorage.setItem(STORE, JSON.stringify(session));
    return true;
  } catch {
    signOut();
    return false;
  }
}

export function signOut() {
  const token = session?.access_token;
  session = null;
  sessionStorage.removeItem(STORE);
  sessionStorage.removeItem('archive-admin-last-activity');
  if (token) void fetch(BASE + '/auth/v1/logout?scope=local', {
    method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${token}` }
  }).catch(() => {});
}

export function signedIn() {
  return Boolean(session?.access_token);
}
