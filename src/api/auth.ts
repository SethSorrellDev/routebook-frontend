const STORAGE_KEY = 'routebook_auth';

/**
 * Credentials are stored as a pre-built "Basic <base64>" header value in
 * sessionStorage - cleared automatically when the tab closes, which is
 * an appropriate lifetime for a single-admin demo tool (no "remember me"
 * complexity needed).
 */
export function setCredentials(username: string, password: string): void {
  const encoded = btoa(`${username}:${password}`);
  sessionStorage.setItem(STORAGE_KEY, `Basic ${encoded}`);
  sessionStorage.setItem('routebook_auth_username', username);
}

export function clearCredentials(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem('routebook_auth_username');
}

export function getAuthHeader(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function getAuthUsername(): string | null {
  return sessionStorage.getItem('routebook_auth_username');
}

export function isLoggedIn(): boolean {
  return getAuthHeader() !== null;
}
