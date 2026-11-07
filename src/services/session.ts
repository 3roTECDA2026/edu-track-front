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
};