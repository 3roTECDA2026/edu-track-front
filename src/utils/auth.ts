// src/utils/auth.ts
export interface StoredUser {
  id: number | string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

/** Rol del back con acceso a la gestión de usuarios. */
export const ADMIN_ROLE = 'ADMINISTRATOR';

export const getStoredUser = (): StoredUser | null => {
  try {
    const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
};

/** Lee el rol desde el token (JWT). */
export const getRoleFromToken = (): string | null => {
  try {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    return payload.role ?? null;
  } catch {
    return null;
  }
};

export const hasRole = (roles?: string[]): boolean => {
  if (!roles || roles.length === 0) return true;
  const role = getRoleFromToken() ?? getStoredUser()?.role;
  return !!role && roles.includes(role);
};