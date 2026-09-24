import { fetchApi } from './api';

export { ApiError } from './api';

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

// Respuesta esperada: { success, data: UserListItem[], pagination: { total } }
// Si tu backend devuelve otra forma, se adapta solo acá.
export async function listUsers(q: UsersQuery, signal?: AbortSignal): Promise<UsersPageResult> {
  const params = new URLSearchParams({ page: String(q.page), limit: String(q.limit) });
  if (q.search) params.set('search', q.search);
  if (q.role) params.set('role', q.role);
  if (q.active) params.set('active', q.active);

  const body = await fetchApi<{ data: UserListItem[]; pagination: { total: number } }>(
    `/users?${params.toString()}`,
    { signal },
  );
  return { items: body.data, total: body.pagination.total };
}

export const createUser = (payload: CreateUserPayload) =>
  fetchApi<{ data: UserListItem }>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateUser = (id: UserListItem['id'], payload: UpdateUserPayload) =>
  fetchApi<{ data: UserListItem }>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const suspendUser = (id: UserListItem['id']) =>
  fetchApi<{ data: UserListItem }>(`/users/${id}/suspend`, { method: 'PATCH' });

export const activateUser = (id: UserListItem['id']) =>
  fetchApi<{ data: UserListItem }>(`/users/${id}/activate`, { method: 'PATCH' });