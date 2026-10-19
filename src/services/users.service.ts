import { fetchApi } from '@/services/api';

export { ApiError } from '@/services/api';

export const ROLES = ['admin', 'docente', 'preceptor'] as const;
export type Role = (typeof ROLES)[number];

export interface UserListItem {
  id: number | string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string | null;
  username: string;
  role: Role;
  active: boolean;
  courseIds: number[]; // cursos asignados (solo docentes)
}

export interface UsersQuery {
  page: number; // 1-based (API)
  limit: number;
  search?: string;
  role?: Role | '';
  active?: 'true' | 'false' | '';
}

export interface UsersPageResult {
  items: UserListItem[];
  total: number;
}

interface BackendUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMINISTRATOR' | 'SCHOOL_MANAGEMENT' | 'EOE_DIRECTIVE' | 'TEACHER' | 'STUDENT' | 'FAMILY';
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}

interface BackendUsersEnvelope {
  success: boolean;
  data: {
    items: BackendUser[];
    pagination: {
      total: number;
    };
  };
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

export type CreateUserPayload = UserPayload & { password: string };
export type UpdateUserPayload = UserPayload & { password?: string }; // password solo si se completó

function mapBackendRole(role: BackendUser['role']): Role {
  if (role === 'ADMINISTRATOR') return 'admin';
  if (role === 'TEACHER') return 'docente';
  return 'preceptor';
}

function mapBackendUser(user: BackendUser): UserListItem {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    dni: '',
    email: user.email,
    phone: null,
    username: user.email.split('@')[0] ?? user.email,
    role: mapBackendRole(user.role),
    active: user.status === 'ACTIVE',
    courseIds: [],
  };
}

// Respuesta esperada: { success, data: UserListItem[], pagination: { total } }
// Si tu backend devuelve otra forma, se adapta solo acá.
export async function listUsers(q: UsersQuery, signal?: AbortSignal): Promise<UsersPageResult> {
  const params = new URLSearchParams({ page: String(q.page), limit: String(q.limit) });
  if (q.search) params.set('search', q.search);

  if (q.role) {
    const roleMap: Record<Role, BackendUser['role']> = {
      admin: 'ADMINISTRATOR',
      docente: 'TEACHER',
      preceptor: 'SCHOOL_MANAGEMENT',
    };
    params.set('role', roleMap[q.role]);
  }

  if (q.active) params.set('active', q.active);

  const body = await fetchApi<BackendUsersEnvelope>(
    `/api/users?${params.toString()}`,
    { signal },
  );

  return {
    items: body.data.items.map(mapBackendUser),
    total: body.data.pagination.total,
  };
}

export const createUser = (payload: CreateUserPayload) =>
  fetchApi<{ data: UserListItem }>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateUser = (id: UserListItem['id'], payload: UpdateUserPayload) =>
  fetchApi<{ data: UserListItem }>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const suspendUser = (id: UserListItem['id']) =>
  fetchApi<{ data: UserListItem }>(`/api/users/${id}/suspend`, { method: 'PATCH' });

export const activateUser = (id: UserListItem['id']) =>
  fetchApi<{ data: UserListItem }>(`/api/users/${id}/activate`, { method: 'PATCH' });