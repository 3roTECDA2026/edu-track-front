
import { fetchApi } from '@/services/api';

export { ApiError } from '@/services/api';

// =====================================================
// ROLES DEL FRONTEND
// =====================================================

// La API recibe los roles en minúscula.
// Prisma realiza su propia conversión internamente.
export const ROLES = ['admin', 'docente', 'preceptor'] as const;

export type Role = (typeof ROLES)[number];

// Roles definidos en Prisma.
export type BackendRole =
  | 'ADMINISTRATOR'
  | 'TEACHER'
  | 'PRECEPTOR';

// Estados definidos en Prisma.
export type BackendUserStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'INACTIVE';

// Conversión de roles de Prisma al frontend.
// El backend actual devuelve roles en minúscula,
// pero conservamos compatibilidad con valores Prisma.
const ROLE_FROM_BACKEND: Record<BackendRole, Role> = {
  ADMINISTRATOR: 'admin',
  TEACHER: 'docente',
  PRECEPTOR: 'preceptor',
};

// =====================================================
// TIPOS DEL FRONTEND
// =====================================================

export interface UserListItem {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string | null;
  username: string;
  role: Role;
  active: boolean;
  courseIds: number[];
}

export interface UsersQuery {
  page: number;
  limit: number;
  search?: string;
  role?: Role | '';
  active?: 'true' | 'false' | '';
}

export interface UsersPageResult {
  items: UserListItem[];
  total: number;
}

// Conservamos los campos heredados para mantener
// compatibilidad con los componentes existentes.
export interface UserPayload {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string | null;
  username: string;
  role: Role;
  active: boolean;
  courseIds: number[];
}

export type CreateUserPayload = UserPayload & {
  password: string;
};

export type UpdateUserPayload = UserPayload & {
  password?: string;
};

// =====================================================
// TIPOS DE RESPUESTA DEL BACKEND
// =====================================================

interface BackendUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;

  // El backend actual devuelve admin o docente.
  // Preceptor quedará disponible cuando se habilite.
  role: Role | BackendRole;

  // La API actual devuelve active.
  // status se mantiene por compatibilidad.
  active?: boolean;
  status?: BackendUserStatus;

  // Campos heredados opcionales.
  dni?: string | null;
  phone?: string | null;
  username?: string | null;
  courseIds?: number[];
}

interface BackendResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

interface BackendListResponse
  extends BackendResponse<BackendUser[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// =====================================================
// CONVERSIÓN DE DATOS
// =====================================================

// Convertir rol del backend al frontend.
function fromBackendRole(role: BackendUser['role']): Role {
  if (
    role === 'admin' ||
    role === 'docente' ||
    role === 'preceptor'
  ) {
    return role;
  }

  const converted = ROLE_FROM_BACKEND[role as BackendRole];

  if (!converted) {
    throw new Error(
      `Rol de usuario no soportado por el frontend: ${role}`,
    );
  }

  return converted;
}

// Convertir usuario recibido de la API.
function fromBackendUser(user: BackendUser): UserListItem {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,

    role: fromBackendRole(user.role),

    active:
      typeof user.active === 'boolean'
        ? user.active
        : user.status === 'ACTIVE',

    // Estos campos todavía no están implementados
    // en el modelo User de Prisma.
    dni: user.dni ?? '',
    phone: user.phone ?? null,
    username: user.username ?? user.email,
    courseIds: user.courseIds ?? [],
  };
}

// =====================================================
// DATOS PARA CREAR USUARIOS
// =====================================================

function toBackendCreatePayload(payload: CreateUserPayload) {
  return {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: payload.email.trim().toLowerCase(),

    // La API espera admin, docente o, cuando
    // se habilite, preceptor.
    role: payload.role,

    active: payload.active,
    password: payload.password,
  };
}

// =====================================================
// DATOS PARA ACTUALIZAR USUARIOS
// =====================================================

function toBackendUpdatePayload(payload: UpdateUserPayload) {
  return {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: payload.email.trim().toLowerCase(),

    role: payload.role,
    active: payload.active,

    // No enviamos password en edición.
  };
}

// =====================================================
// GET /api/users
// LISTAR USUARIOS
// =====================================================

export async function listUsers(
  query: UsersQuery,
  signal?: AbortSignal,
): Promise<UsersPageResult> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });

  if (query.search?.trim()) {
    params.set('search', query.search.trim());
  }

  // El backend espera el rol en minúscula.
  if (query.role) {
    params.set('role', query.role);
  }

  if (query.active) {
    params.set('active', query.active);
  }

  const response = await fetchApi<BackendListResponse>(
    `/users?${params.toString()}`,
    {
      signal,
    },
  );

  return {
    items: response.data.map(fromBackendUser),
    total: response.pagination.total,
  };
}

// =====================================================
// GET /api/users/:id
// OBTENER USUARIO
// =====================================================

// Esta función queda preparada, pero la ruta GET /:id
// todavía no aparece implementada en user.routes.ts.
export async function getUserById(
  id: UserListItem['id'],
): Promise<UserListItem> {
  const response = await fetchApi<
    BackendResponse<BackendUser>
  >(`/users/${encodeURIComponent(id)}`);

  return fromBackendUser(response.data);
}

// =====================================================
// POST /api/users
// CREAR USUARIO
// =====================================================

export async function createUser(
  payload: CreateUserPayload,
): Promise<BackendResponse<UserListItem>> {
  const response = await fetchApi<
    BackendResponse<BackendUser>
  >('/users', {
    method: 'POST',
    body: JSON.stringify(
      toBackendCreatePayload(payload),
    ),
  });

  return {
    ...response,
    data: fromBackendUser(response.data),
  };
}

// =====================================================
// PUT /api/users/:id
// ACTUALIZAR USUARIO
// =====================================================

export async function updateUser(
  id: UserListItem['id'],
  payload: UpdateUserPayload,
): Promise<BackendResponse<UserListItem>> {
  const response = await fetchApi<
    BackendResponse<BackendUser>
  >(`/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(
      toBackendUpdatePayload(payload),
    ),
  });

  return {
    ...response,
    data: fromBackendUser(response.data),
  };
}

// =====================================================
// PATCH /api/users/:id/suspend
// SUSPENDER USUARIO
// =====================================================

export async function suspendUser(
  id: UserListItem['id'],
): Promise<BackendResponse<UserListItem>> {
  const response = await fetchApi<
    BackendResponse<BackendUser>
  >(`/users/${encodeURIComponent(id)}/suspend`, {
    method: 'PATCH',
  });

  return {
    ...response,
    data: fromBackendUser(response.data),
  };
}

// =====================================================
// PATCH /api/users/:id/activate
// REACTIVAR USUARIO
// =====================================================

export async function activateUser(
  id: UserListItem['id'],
): Promise<BackendResponse<UserListItem>> {
  const response = await fetchApi<
    BackendResponse<BackendUser>
  >(`/users/${encodeURIComponent(id)}/activate`, {
    method: 'PATCH',
  });

  return {
    ...response,
    data: fromBackendUser(response.data),
  };
}
