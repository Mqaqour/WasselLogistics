// Portal (admin) auth helper.
//
// The backend issues a session token on login: it is set as an HttpOnly cookie
// (works for same-origin deployments) AND returned in the JSON body so we can
// also send it as `Authorization: Bearer` (works when the API is on another
// origin via VITE_CHAT_BACKEND_URL). `requireAuth` on the backend accepts either.

const TOKEN_KEY = 'wsl_token';

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable — the HttpOnly cookie still covers same-origin calls */
  }
}

export function clearAdminToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** `fetch` wrapper that attaches the portal session (Bearer header + cookie). */
export function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(init.headers ?? {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers, credentials: 'include' });
}
