import type { EdteMeetingPeriod, EdteMeetingStatus } from '@/services/edteMeeting.service'
import type { BackendRole } from '@/services/users.service'

// Traducción de los enums de las reuniones del EDTE (CRM-075) a los textos que ve el usuario

export const MEETING_PERIOD_LABELS: Record<EdteMeetingPeriod, string> = {
  FEBRUARY_MARCH: 'Febrero / Marzo',
  AUGUST: 'Agosto',
  DECEMBER: 'Diciembre',
  ADDITIONAL: 'Adicional',
}

// Para qué sirve la reunión de cada período (DA7, 2.3)
export const MEETING_PERIOD_HINTS: Record<EdteMeetingPeriod, string> = {
  FEBRUARY_MARCH: 'Se analizan los estudiantes derivados y se arma su PATE.',
  AUGUST: 'Seguimiento de los PATE en curso.',
  DECEMBER: 'Seguimiento de los PATE en curso.',
  ADDITIONAL: 'Reunión fuera de los períodos previstos.',
}

// Estado del registro, en blanco y negro como el resto de la app
export const MEETING_STATUS_CONFIG: Record<
  EdteMeetingStatus,
  { label: string; color: string; background: string }
> = {
  DRAFT: { label: 'Borrador', color: '#374151', background: '#f3f4f6' },
  SIGNED: { label: 'Firmada', color: '#ffffff', background: '#111827' },
}

// Rol de cada integrante convocado (provisorio hasta CRM-071, que suma el rol dentro del EDTE)
export const MEMBER_ROLE_LABELS: Record<BackendRole, string> = {
  ADMINISTRATOR: 'Administración',
  SCHOOL_MANAGEMENT: 'Dirección',
  EOE_DIRECTIVE: 'EOE',
  TEACHER: 'Docente',
  PRECEPTOR: 'Preceptoría',
  STUDENT: 'Estudiante',
  FAMILY: 'Familia',
}

export const memberRoleLabel = (role: string | null) =>
  role ? (MEMBER_ROLE_LABELS[role as BackendRole] ?? role) : '—'

// Estado del PATE: incluye los valores de hoy y los que suma CRM-078
const PATE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'En curso',
  UNDER_FOLLOW_UP: 'En curso',
  FINISHED: 'Cerrado',
  DRAFT: 'Borrador',
  IN_PROGRESS: 'En curso',
  CLOSED: 'Cerrado',
}

export const pateStatusLabel = (status: string) => PATE_STATUS_LABELS[status] ?? status

// Quienes cargan, editan y firman las reuniones. El back valida igual los permisos.
export const EDTE_MANAGER_ROLES = ['ADMINISTRATOR', 'SCHOOL_MANAGEMENT', 'EOE_DIRECTIVE']

// AAAA-MM-DD → DD/MM/AAAA
export const formatMeetingDate = (date: string) => date.split('-').reverse().join('/')
