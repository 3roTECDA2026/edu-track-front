import type { Shift, StatusFilter, StudentStatus } from '@/services/students.service';

// Soft badge colors, following the design reference.
export const STATUS_CONFIG: Record<StudentStatus, { label: string; color: string; background: string }> = {
  ACTIVE: { label: 'Activo', color: '#1e8e3e', background: '#e6f4ea' },
  INACTIVE: { label: 'Inactivo', color: '#c5221f', background: '#fce8e6' },
  CONDITIONAL: { label: 'Condicional', color: '#b06000', background: '#fef7e0' },
  GRADUATED: { label: 'Egresado', color: '#1967d2', background: '#e8f0fe' },
  TRANSFER_OUT: { label: 'Pase saliente', color: '#5f6368', background: '#f1f3f4' },
};

export const SHIFT_LABELS: Record<Shift, string> = {
  MORNING: 'Mañana',
  AFTERNOON: 'Tarde',
  EVENING: 'Vespertino',
  EXTRA_TIME: 'Contraturno',
};

export const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
  { value: 'all', label: 'Todos los estados' },
];

// Temporary fixed options until there is an endpoint that lists class sections.
export const GRADE_OPTIONS = [1, 2, 3, 4, 5, 6];
export const DIVISION_OPTIONS = ['A', 'B', 'C', 'D'];
