const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

export interface HealthResponse {
  status: string;
  message: string;
}

export interface ApiErrorBody {
  error?: string;
  message?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error || body.message || `Error ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.details = body.details;
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    sessionStorage.getItem('token') ||
    localStorage.getItem('token');

  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const apiBase = API_URL.endsWith('/api')
    ? API_URL
    : `${API_URL}/api`;

  const path = endpoint
    .replace(/^\/+/, '')
    .replace(/^api\//, '');

  const response = await fetch(`${apiBase}/${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: response.statusText,
    }));

    throw new ApiError(response.status, errorData);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
