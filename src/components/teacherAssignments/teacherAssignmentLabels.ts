import { ApiError, type Shift, type TeacherSummary } from '@/services/teacherAssignments.service';

export const SHIFT_LABELS: Record<Shift, string> = {
  MORNING: 'Mañana',
  AFTERNOON: 'Tarde',
  EVENING: 'Vespertino',
  EXTRA_TIME: 'Contraturno',
};

// Años de cursada de la secundaria (ClassSection.grade)
export const GRADES = [1, 2, 3, 4, 5, 6] as const;

export const getTeacherName = (t: Pick<TeacherSummary, 'firstName' | 'lastName'>) =>
  `${t.lastName}, ${t.firstName}`;

export const getShiftLabel = (shift?: string) =>
  shift ? (SHIFT_LABELS[shift as Shift] ?? shift) : '';

export const getSectionLabel = (s: { grade: number; division: string; shift?: string }) => {
  const shift = getShiftLabel(s.shift);
  return `${s.grade}° ${s.division}${shift ? ` (${shift})` : ''}`;
};

const SESSION_EXPIRED = 'Tu sesión venció. Volvé a iniciar sesión.';
const NO_PERMISSION = 'No tenés permisos para esta acción. Contactá a un administrador.';
const SERVER_ERROR = 'Ocurrió un error en el servidor. Intentá de nuevo en unos minutos.';

// Mensaje al fallar la carga de una lista (docentes, asignaciones). Nunca muestra el texto crudo del back.
export function getLoadErrorMessage(error: unknown, resource: string): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return SESSION_EXPIRED;
    if (error.status === 403) return `No tenés permisos para listar ${resource}. Contactá a un administrador.`;
    if (error.status >= 500) return SERVER_ERROR;
  }
  return `No se pudieron cargar ${resource}.`;
}

export function getAssignmentErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;

  switch (error.status) {
    case 400:
      return 'Revisá los datos ingresados.';
    case 401:
      return SESSION_EXPIRED;
    case 403:
      return NO_PERMISSION;
    case 404:
      return 'No se encontró el registro. Recargá la página e intentá de nuevo.';
    case 409:
      if (error.message === 'Resource already exists') {
        return 'Este docente ya tiene asignada esa materia en ese curso.';
      }
      if (error.message === 'Related resource not found') {
        return 'El docente, la materia o el curso ya no existe. Recargá la página e intentá de nuevo.';
      }
      return 'No se pudo guardar. Revisá que el usuario elegido tenga rol docente.';
    default:
      return error.status >= 500 ? SERVER_ERROR : fallback;
  }
}
