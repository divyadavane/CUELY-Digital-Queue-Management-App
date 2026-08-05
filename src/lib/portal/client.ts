const SESSION_KEY = "cuely_portal_session";

export class PortalApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "PortalApiError";
    this.status = status;
  }
}

export function getPortalToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function setPortalToken(token: string) {
  window.localStorage.setItem(SESSION_KEY, token);
}

export function clearPortalToken() {
  window.localStorage.removeItem(SESSION_KEY);
}

export async function portalApi<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getPortalToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) clearPortalToken();
    throw new PortalApiError(body?.error || "Request failed", res.status);
  }

  return body as T;
}
