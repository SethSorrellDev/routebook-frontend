const ACCESS_KEY = 'routebook_access_token';
const REFRESH_KEY = 'routebook_refresh_token';
const EMAIL_KEY = 'routebook_auth_email';

// Set at build time for production; local dev talks to identity-service directly.
const IDENTITY_URL = import.meta.env.VITE_IDENTITY_URL ?? 'http://localhost:8081';

/** Window event fired when the session can no longer be refreshed. */
export const AUTH_EXPIRED_EVENT = 'routebook:auth-expired';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

/**
 * Identity-service errors use a different shape ({timestamp, error}) from
 * RouteBook's own ErrorResponse, so sign-in failures get their own type.
 */
export class IdentityError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'IdentityError';
    this.status = status;
  }
}

function storeTokens(tokens: TokenResponse): void {
  sessionStorage.setItem(ACCESS_KEY, tokens.accessToken);
  sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export async function login(email: string, password: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${IDENTITY_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new IdentityError('Could not reach the sign-in service.', 0);
  }

  if (!response.ok) {
    let message = 'Sign-in failed.';
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // keep the generic message
    }
    throw new IdentityError(message, response.status);
  }

  storeTokens(await response.json());
  sessionStorage.setItem(EMAIL_KEY, email);
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const response = await fetch(`${IDENTITY_URL}/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return false;
    storeTokens(await response.json());
    return true;
  } catch {
    return false;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/** Concurrent callers share one refresh request. */
export function refreshTokens(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export function clearCredentials(): void {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(EMAIL_KEY);
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_KEY);
}

export function getAuthEmail(): string | null {
  return sessionStorage.getItem(EMAIL_KEY);
}

export function isLoggedIn(): boolean {
  return getAccessToken() !== null;
}
