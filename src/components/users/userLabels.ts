import type { Role } from '@/services/users.service';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  docente: 'Docente',
  preceptor: 'Preceptor',
};