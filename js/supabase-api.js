const BASE = "https://guewvrivkucbhhlihwfk.supabase.co";
const KEY = "sb_publishable_1AnJ604R9CIGZC_xY9DBeQ_BIZeD64L";
const STORE = "archive-admin-session";
let session = null;
try { session = JSON.parse(sessionStorage.getItem(STORE) || "null"); } catch { sessionStorage.removeItem(STORE); }
export async function api(path, { method = "GET", body, auth = false, headers = {} } = {}) {
  const token = session?.access_token;
  if (auth && !token) throw new Error("ログインしてください。");
  const response = await fetch(BASE + path, {
    method, cache: "no-store", headers: { apikey: KEY, Authorization: `Bearer ${token || KEY}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const failure = new Error(error.message || error.error_description || error.msg || error.error || `HTTP ${response.status}`);
    failure.status = response.status;
    failure.code = error.error_code || error.code || "";
    throw failure;
  }
  if (response.status === 204) return null;
  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
}
export async function signIn(email, password) {
  session = await api("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password } });
  sessionStorage.setItem(STORE, JSON.stringify(session));
  return session;
}
export async function refreshSession() {
  if (!session?.refresh_token) return false;
  try {
    session = await api("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: session.refresh_token } });
    sessionStorage.setItem(STORE, JSON.stringify(session)); return true;
  } catch { signOut(); return false; }
}
export function signOut() { session = null; sessionStorage.removeItem(STORE); }
export function signedIn() { return Boolean(session?.access_token); }
