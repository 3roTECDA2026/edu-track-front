import type {
  AttendanceValue,
  PreliminaryAssessment,
  SubjectStatus,
} from '@/services/studentProfile.service';

export const ASSESSMENT_CONFIG: Record<
  PreliminaryAssessment,
  { color: string; background: string; description: string }
> = {
  TEA: { color: '#1e8e3e', background: '#e6f4ea', description: 'Trayectoria Educativa Avanzada' },
  TEP: { color: '#b06000', background: '#fef7e0', description: 'Trayectoria Educativa en Proceso' },
  TED: { color: '#c5221f', background: '#fce8e6', description: 'Trayectoria Educativa Discontinua' },
};

export const SUBJECT_STATUS_LABELS: Record<SubjectStatus, string> = {
  IN_PROGRESS: 'En curso',
  APPROVED_ACCREDITED: 'Aprobada',
  PENDING_1ST_TERM: 'Pendiente 1° C',
  PENDING_2ND_TERM: 'Pendiente 2° C',
  IN_INTENSIFICATION: 'En intensificación',
  CONTINUES_INTENSIFYING: 'Continúa intensificando',
  MPAA: 'MPAA',
};

// Los mismos pesos que usa el back para calcular las inasistencias.
export const ATTENDANCE_WEIGHT: Record<AttendanceValue, number> = {
  PRESENT: 0,
  ABSENT: 1,
  HALF: 0.5,
  QUARTER: 0.25,
};

export const PASSING_SCORE = 7;
export const EMPTY = '—';

// Las fechas llegan a medianoche UTC, por eso se formatean en UTC para que no se corran un día.
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return EMPTY;
  return new Date(iso).toLocaleDateString('es-AR', { timeZone: 'UTC' });
}

export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatAbsences(value: number): string {
  return value.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

export function getAge(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const birth = new Date(iso);
  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}