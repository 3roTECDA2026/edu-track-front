
import { fetchApi } from '@/services/api';

export { ApiError } from '@/services/api';

// =====================================================
// ROLES DEL FRONTEND
// =====================================================

export const ROLES = ['admin', 'docente', 'preceptor'] as const;

export type Role = (typeof ROLES)[number];

export type BackendRole =
  | 'ADMINISTRATOR'
  | 'SCHOOL_MANAGEMENT'
  | 'EOE_DIRECTIVE'
  | 'TEACHER'
  | 'PRECEPTOR'
  | 'STUDENT'
  | 'FAMILY';

export type BackendUserStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'INACTIVE';

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
// TIPOS DEL BACKEND
// =====================================================

interface BackendUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: BackendRole | Role;
  status?: BackendUserStatus;
  active?: boolean;
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

interface BackendPagination {
  page?: number;
  limit?: number;
  total: number;
}

type BackendListResponse =
  | {
      success: boolean;
      data: BackendUser[];
      pagination: BackendPagination;
    }
  | {
      success: boolean;
      data: {
        items: BackendUser[];
        pagination: BackendPagination;
      };
    };

// =====================================================
// CONVERSIÓN DE ROLES
// =====================================================

const ROLE_TO_BACKEND: Record<Role, BackendRole> = {
  admin: 'ADMINISTRATOR',
  docente: 'TEACHER',
  preceptor: 'SCHOOL_MANAGEMENT',
};

function fromBackendRole(role: BackendUser['role']): Role {
  switch (role) {
    case 'admin':
    case 'ADMINISTRATOR':
      return 'admin';

    case 'docente':
    case 'TEACHER':
      return 'docente';

    case 'preceptor':
    case 'PRECEPTOR':
    case 'SCHOOL_MANAGEMENT':
      return 'preceptor';

    default:
      throw new Error(
        `Rol no soportado por el frontend: ${role}`
      );
  }
}

// =====================================================
// CONVERSIÓN DE USUARIOS
// =====================================================

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

    dni: user.dni ?? '',
    phone: user.phone ?? null,
    username: user.username ?? user.email,
    courseIds: user.courseIds ?? [],
  };
}

// =====================================================
// DATOS PARA CREAR USUARIO
// =====================================================

function toBackendCreatePayload(payload: CreateUserPayload) {
  return {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: payload.email.trim().toLowerCase(),
    role: ROLE_TO_BACKEND[payload.role],
    status: payload.active ? 'ACTIVE' : 'SUSPENDED',
    password: payload.password,
  };
}

// =====================================================
// DATOS PARA ACTUALIZAR USUARIO
// =====================================================

function toBackendUpdatePayload(payload: UpdateUserPayload) {
  return {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: payload.email.trim().toLowerCase(),
    role: ROLE_TO_BACKEND[payload.role],
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

  if (query.role) {
    params.set('role', ROLE_TO_BACKEND[query.role]);
  }

  if (query.active) {
    params.set('active', query.active);
  }

  const response = await fetchApi<BackendListResponse>(
    `/users?${params.toString()}`,
    { signal },
  );

  const data = response.data;

  if (Array.isArray(data)) {
    return {
      items: data.map(fromBackendUser),
      total: response.pagination.total,
    };
  }

  return {
    items: data.items.map(fromBackendUser),
    total: data.pagination.total,
  };
}

// =====================================================
// GET /api/users/:id
// OBTENER USUARIO
// =====================================================

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
      toBackendCreatePayload(payload)
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
      toBackendUpdatePayload(payload)
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
