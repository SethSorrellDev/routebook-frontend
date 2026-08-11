import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, ApiError } from './client';
import { setCredentials, clearCredentials } from './auth';

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

  it('attaches the Authorization header when credentials are set', async () => {
    setCredentials('admin', 'secret123');
    const fetchMock = mockFetchOnce([]);
    await api.drivers.getAll();
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Authorization']).toBe(`Basic ${btoa('admin:secret123')}`);
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
