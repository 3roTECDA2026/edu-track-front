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

// Arma y manda el pedido con el token. Lanza ApiError si la respuesta no es OK.
async function request(endpoint: string, options: RequestInit): Promise<Response> {
  const token = getAuthToken();

  const headers = new Headers(options.headers);

  // Con FormData (subida de archivos) no se pone Content-Type: lo arma el navegador,
  // con el separador (boundary) entre archivos. Si lo forzamos a JSON, la subida se rompe.
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const baseUrl = API_URL.replace(/\/+$/, '');
  const path = endpoint.replace(/^\/+/, '');
  const response = await fetch(`${baseUrl}/${path}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(response.status, errorData);
  }

  return response;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await request(endpoint, options);
  return response.json() as Promise<T>;
}

// Igual que fetchApi, pero devuelve el contenido como archivo (Blob), para descargas.
// Un <a href> no manda el token: por eso los archivos protegidos se piden con esta función.
export async function fetchApiBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
  const response = await request(endpoint, options);
  return response.blob();
}
