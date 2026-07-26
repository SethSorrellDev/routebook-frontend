import type {
  DriverDto,
  RouteDto,
  StopDto,
  KnowledgeEntryDto,
  AttachmentDto,
  LocationDto,
  ErrorResponse,
} from '../types';

/**
 * Thrown for any non-2xx response. Carries the backend's ErrorResponse
 * shape directly so callers can read .message and .fieldErrors without
 * re-parsing anything.
 */
export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string> | null;

  constructor(errorResponse: ErrorResponse) {
    super(errorResponse.message);
    this.name = 'ApiError';
    this.status = errorResponse.status;
    this.fieldErrors = errorResponse.fieldErrors;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: options?.body instanceof FormData
      ? undefined
      : { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    // Every error from the backend follows the ErrorResponse shape
    // (see GlobalExceptionHandler), so this parse should always succeed.
    const errorBody: ErrorResponse = await response.json();
    throw new ApiError(errorBody);
  }

  // DELETE endpoints return 204 No Content - nothing to parse.
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  drivers: {
    getAll: () => request<DriverDto[]>('/api/drivers'),
    getById: (id: number) => request<DriverDto>(`/api/drivers/${id}`),
    create: (data: Omit<DriverDto, 'id'>) =>
      request<DriverDto>('/api/drivers', { method: 'POST', body: JSON.stringify(data) }),
  },

  locations: {
    getAll: () => request<LocationDto[]>('/api/locations'),
    create: (data: Omit<LocationDto, 'id'>) =>
      request<LocationDto>('/api/locations', { method: 'POST', body: JSON.stringify(data) }),
  },

  routes: {
    getAll: () => request<RouteDto[]>('/api/routes'),
    getById: (id: number) => request<RouteDto>(`/api/routes/${id}`),
    create: (data: Omit<RouteDto, 'id'>) =>
      request<RouteDto>('/api/routes', { method: 'POST', body: JSON.stringify(data) }),
  },

  stops: {
    getAllForRoute: (routeId: number) => request<StopDto[]>(`/api/routes/${routeId}/stops`),
    create: (routeId: number, data: Omit<StopDto, 'id' | 'routeId'>) =>
      request<StopDto>(`/api/routes/${routeId}/stops`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  knowledgeEntries: {
    getFiltered: (params?: { routeId?: number; stopId?: number }) => {
      const query = new URLSearchParams();
      if (params?.routeId != null) query.set('routeId', String(params.routeId));
      if (params?.stopId != null) query.set('stopId', String(params.stopId));
      const qs = query.toString();
      return request<KnowledgeEntryDto[]>(`/api/knowledge-entries${qs ? `?${qs}` : ''}`);
    },
    getById: (id: number) => request<KnowledgeEntryDto>(`/api/knowledge-entries/${id}`),
    create: (data: Omit<KnowledgeEntryDto, 'id'>) =>
      request<KnowledgeEntryDto>('/api/knowledge-entries', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  attachments: {
    getAllForEntry: (knowledgeEntryId: number) =>
      request<AttachmentDto[]>(`/api/knowledge-entries/${knowledgeEntryId}/attachments`),
    upload: (knowledgeEntryId: number, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return request<AttachmentDto>(`/api/knowledge-entries/${knowledgeEntryId}/attachments`, {
        method: 'POST',
        body: formData,
      });
    },
    delete: (attachmentId: number) =>
      request<void>(`/api/attachments/${attachmentId}`, { method: 'DELETE' }),
  },
};
