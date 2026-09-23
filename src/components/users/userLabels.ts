import type { Role, UserListItem } from '@/services/users.service';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  docente: 'Docente',
  preceptor: 'Preceptor',
};

export const getFullName = (user: Pick<UserListItem, 'firstName' | 'lastName'>) =>
  `${user.firstName} ${user.lastName}`;