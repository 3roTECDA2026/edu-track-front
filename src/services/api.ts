const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface HealthResponse {
  status: string;
  message: string;
}

export interface ApiErrorBody {
  error: string;
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

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('token') || localStorage.getItem('token');
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const baseUrl = API_URL.replace(/\/+$/, '');
  const path = endpoint.replace(/^\/+/, '');
  const response = await fetch(`${baseUrl}/${path}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(response.status, errorData);
  }

  return response.json() as Promise<T>;
}