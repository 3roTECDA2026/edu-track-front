export interface SessionUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  role?: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRATOR: 'Administrador/a',
  SCHOOL_MANAGEMENT: 'Dirección',
  EOE_DIRECTIVE: 'EOE',
  TEACHER: 'Docente',
  PRECEPTOR: 'Preceptor/a',
};

const readFrom = (storage: Storage, key: string) => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

export const getToken = (): string | null =>
  readFrom(sessionStorage, 'token') ?? readFrom(localStorage, 'token');

export const getSessionUser = (): SessionUser | null => {
  const raw = readFrom(sessionStorage, 'user') ?? readFrom(localStorage, 'user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
};

// Rol del usuario: sale del token (JWT) y, si no se puede leer, del usuario guardado
export const getRole = (): string | undefined => {
  const token = getToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (typeof payload.role === 'string') return payload.role;
    } catch {
      /* token ilegible: se usa el usuario guardado */
    }
  }
  return getSessionUser()?.role;
};

export const getRoleLabel = (role?: string): string =>
  (role && ROLE_LABELS[role]) || role || '';

export const getDisplayName = (u: SessionUser): string =>
  [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name || u.email || 'Usuario';

export const clearSession = () => {
  for (const key of ['token', 'user']) {
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch {
      /* sin storage disponible */
    }
  }
}
export const ADMIN_ROLES = ['ADMINISTRATOR', 'SCHOOL_MANAGEMENT'];
export const USER_MANAGEMENT_ROLES = ['ADMINISTRATOR']

export const canAdminister = (): boolean => {
  const role = getRole();
  return !!role && ADMIN_ROLES.includes(role);
};

// Gestionan las trayectorias (Plan Forte, EDTE): dirección, EOE y administración
export const TRAJECTORY_MANAGER_ROLES = ['ADMINISTRATOR', 'SCHOOL_MANAGEMENT', 'EOE_DIRECTIVE'];

export const canManageTrajectories = (): boolean => {
  const role = getRole();
  return !!role && TRAJECTORY_MANAGER_ROLES.includes(role);
};