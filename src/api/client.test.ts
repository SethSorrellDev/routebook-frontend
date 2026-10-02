import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, ApiError } from './client';
import { login, clearCredentials, getAccessToken, isLoggedIn, AUTH_EXPIRED_EVENT } from './auth';

function mockFetchOnce(body: unknown, options: { ok?: boolean; status?: number } = {}) {
  const { ok = true, status = 200 } = options;
  const mockResponse = {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));
  return fetch as unknown as ReturnType<typeof vi.fn>;
}

/** Each call to fetch returns the next response in order. */
function mockFetchSequence(...responses: Array<{ ok: boolean; status: number; body: unknown }>) {
  const fetchMock = vi.fn();
  for (const r of responses) {
    fetchMock.mockResolvedValueOnce({ ok: r.ok, status: r.status, json: () => Promise.resolve(r.body) } as Response);
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const unauthorized = {
  ok: false,
  status: 401,
  body: { status: 401, message: 'Authentication required for this operation', timestamp: 'x', fieldErrors: null },
};

/** Logs in through the real auth module so tests don't depend on storage key names. */
async function signIn(accessToken = 'access-1', refreshToken = 'refresh-1') {
  mockFetchOnce({ accessToken, refreshToken, tokenType: 'Bearer', expiresIn: 900 });
  await login('admin@example.com', 'pw');
  vi.unstubAllGlobals();
}

describe('api client', () => {
  beforeEach(() => {
    clearCredentials();
    vi.unstubAllGlobals();
  });

  it('returns parsed JSON on a successful response', async () => {
    mockFetchOnce([{ id: 1, employeeId: 'EMP-1001', firstName: 'S.', lastName: 'Anderson', email: null }]);
    const result = await api.drivers.getAll();
    expect(result).toHaveLength(1);
    expect(result[0].employeeId).toBe('EMP-1001');
  });

  it('does not attach an Authorization header when logged out', async () => {
    const fetchMock = mockFetchOnce([]);
    await api.drivers.getAll();
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Authorization']).toBeUndefined();
  });

  it('attaches a Bearer token when signed in', async () => {
    await signIn('access-1');
    const fetchMock = mockFetchOnce([]);
    await api.drivers.getAll();
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Authorization']).toBe('Bearer access-1');
  });

  it('refreshes once on a 401 and retries with the new token', async () => {
    await signIn('expired-access', 'refresh-1');
    const fetchMock = mockFetchSequence(
      unauthorized,
      { ok: true, status: 200, body: { accessToken: 'access-2', refreshToken: 'refresh-2', tokenType: 'Bearer', expiresIn: 900 } },
      { ok: true, status: 200, body: [] }
    );

    const result = await api.drivers.getAll();

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(3); // original, refresh, retry
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/token/refresh');
    expect(fetchMock.mock.calls[2][1].headers['Authorization']).toBe('Bearer access-2');
    expect(getAccessToken()).toBe('access-2');
  });

  it('drops the session, announces it, and retries anonymously when refresh fails', async () => {
    await signIn('expired-access', 'expired-refresh');
    const expired = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, expired);

    const fetchMock = mockFetchSequence(
      unauthorized,
      { ok: false, status: 400, body: { timestamp: 'x', error: 'Token expired' } },
      { ok: true, status: 200, body: [] }
    );

    const result = await api.drivers.getAll();
    window.removeEventListener(AUTH_EXPIRED_EVENT, expired);

    expect(result).toEqual([]); // public read still works
    expect(isLoggedIn()).toBe(false);
    expect(expired).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[2][1].headers['Authorization']).toBeUndefined();
  });

  it('does not try to refresh when there is no session', async () => {
    const fetchMock = mockFetchSequence(unauthorized);
    await expect(api.drivers.getAll()).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws an ApiError with the backend\'s status/message/fieldErrors on a non-2xx response', async () => {
    mockFetchOnce(
      { status: 400, message: 'Validation failed', timestamp: '2026-01-01T00:00:00Z', fieldErrors: { title: 'title is required' } },
      { ok: false, status: 400 }
    );

    await expect(api.knowledgeEntries.create({
      title: '',
      body: 'x',
      category: 'OTHER',
      routeId: 1,
      stopId: null,
    })).rejects.toMatchObject({
      status: 400,
      message: 'Validation failed',
      fieldErrors: { title: 'title is required' },
    });
  });

  it('thrown errors are instances of ApiError specifically', async () => {
    mockFetchOnce(
      { status: 404, message: 'No driver found with id 999', timestamp: '2026-01-01T00:00:00Z', fieldErrors: null },
      { ok: false, status: 404 }
    );

    try {
      await api.drivers.getById(999);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
    }
  });

  it('returns undefined for a 204 No Content response without trying to parse a body', async () => {
    const mockResponse = { ok: true, status: 204, json: () => Promise.reject(new Error('should not be called')) } as unknown as Response;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await api.attachments.delete(1);
    expect(result).toBeUndefined();
  });
});
