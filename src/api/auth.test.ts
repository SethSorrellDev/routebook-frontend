import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  login,
  refreshTokens,
  clearCredentials,
  getAccessToken,
  getRefreshToken,
  getAuthEmail,
  isLoggedIn,
  IdentityError,
} from './auth';

const tokens = { accessToken: 'access-1', refreshToken: 'refresh-1', tokenType: 'Bearer', expiresIn: 900 };

function jsonResponse(ok: boolean, status: number, body: unknown) {
  return { ok, status, json: () => Promise.resolve(body) } as Response;
}

describe('auth', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('is logged out when nothing is stored', () => {
    expect(isLoggedIn()).toBe(false);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getAuthEmail()).toBeNull();
  });

  it('login stores both tokens and the email', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(true, 200, tokens)));
    await login('a@b.com', 'pw');
    expect(isLoggedIn()).toBe(true);
    expect(getAccessToken()).toBe('access-1');
    expect(getRefreshToken()).toBe('refresh-1');
    expect(getAuthEmail()).toBe('a@b.com');
  });

  it("login surfaces identity-service's error message and stores nothing", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(false, 400, { timestamp: 'x', error: 'Invalid email or password' }))
    );
    await expect(login('a@b.com', 'bad')).rejects.toMatchObject({
      name: 'IdentityError',
      message: 'Invalid email or password',
      status: 400,
    });
    expect(isLoggedIn()).toBe(false);
  });

  it('login reports an unreachable service as an IdentityError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')));
    await expect(login('a@b.com', 'pw')).rejects.toBeInstanceOf(IdentityError);
  });

  it('refreshTokens swaps in the new token pair', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(jsonResponse(true, 200, tokens))
        .mockResolvedValueOnce(jsonResponse(true, 200, { ...tokens, accessToken: 'access-2', refreshToken: 'refresh-2' }))
    );
    await login('a@b.com', 'pw');
    expect(await refreshTokens()).toBe(true);
    expect(getAccessToken()).toBe('access-2');
    expect(getRefreshToken()).toBe('refresh-2');
  });

  it('concurrent refreshTokens calls share a single request', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(true, 200, tokens))
      .mockResolvedValue(jsonResponse(true, 200, { ...tokens, accessToken: 'access-2' }));
    vi.stubGlobal('fetch', fetchMock);
    await login('a@b.com', 'pw');
    await Promise.all([refreshTokens(), refreshTokens(), refreshTokens()]);
    expect(fetchMock).toHaveBeenCalledTimes(2); // 1 login + 1 shared refresh
  });

  it('refreshTokens returns false with no refresh token and makes no request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await refreshTokens()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refreshTokens returns false when identity-service rejects the refresh token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(jsonResponse(true, 200, tokens))
        .mockResolvedValueOnce(jsonResponse(false, 400, { error: 'Token expired' }))
    );
    await login('a@b.com', 'pw');
    expect(await refreshTokens()).toBe(false);
  });

  it('clearCredentials reverts to the logged-out state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(true, 200, tokens)));
    await login('a@b.com', 'pw');
    clearCredentials();
    expect(isLoggedIn()).toBe(false);
    expect(getRefreshToken()).toBeNull();
    expect(getAuthEmail()).toBeNull();
  });
});
