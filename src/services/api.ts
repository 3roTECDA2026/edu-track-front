
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

// Obtener token de autenticación
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    sessionStorage.getItem('token') ||
    localStorage.getItem('token')
  );
}

// Función general para consumir la API
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();

  // Respetar los headers existentes
  const headers = new Headers(options.headers);

  // Agregar Content-Type cuando corresponde
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  // Agregar token JWT
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Evitar duplicar /api
  const apiBase = API_URL.endsWith('/api')
    ? API_URL
    : `${API_URL}/api`;

  // Normalizar endpoint
  const path = endpoint
    .replace(/^\/+/, '')
    .replace(/^api\//, '');

  // Realizar petición
  const response = await fetch(`${apiBase}/${path}`, {
    ...options,
    headers,
  });

  // Manejar errores del backend
  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => ({
      error: response.statusText,
    }));

    const body: ApiErrorBody =
      typeof errorData === 'object' &&
      errorData !== null &&
      !Array.isArray(errorData)
        ? (errorData as ApiErrorBody)
        : { error: response.statusText };

    throw new ApiError(response.status, body);
  }

  // Respuestas sin contenido
  if (response.status === 204) {
    return undefined as T;
  }

  // Devolver respuesta JSON
  return response.json() as Promise<T>;
}
