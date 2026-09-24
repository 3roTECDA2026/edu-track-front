const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface HealthResponse {
  status: string;
  message: string;
}

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error || `Error ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.details = body.details;
  }
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const baseUrl = API_URL.replace(/\/+$/, '');
  const path = endpoint.replace(/^\/+/, '');
  const response = await fetch(`${baseUrl}/${path}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
     errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
     response.status,
  errorData.details,
);
  }

  return response.json() as Promise<T>;
}