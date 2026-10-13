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

// El back responde 409 con mensajes en inglés para duplicados y FK inexistentes
export function getAssignmentErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 409 && error.message === 'Resource already exists') {
      return 'Este docente ya tiene asignada esa materia en ese curso.';
    }
    if (error.status === 409 && error.message === 'Related resource not found') {
      return 'El docente, la materia o el curso ya no existe. Recargá la página e intentá de nuevo.';
    }
    if (error.status === 404) {
      return 'No se encontró el registro. Recargá la página e intentá de nuevo.';
    }
    if (error.status === 400) {
      return 'Revisá los datos ingresados.';
    }
    return error.message;
  }
  return error instanceof Error ? error.message : fallback;
}
