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

// Quienes cargan y editan las reuniones. El acta la firma cada integrante presente, sin importar
// su rol (CRM-076). El back valida igual los permisos.
export const EDTE_MANAGER_ROLES = ['ADMINISTRATOR', 'SCHOOL_MANAGEMENT', 'EOE_DIRECTIVE']

// Quienes ven las reuniones: el personal de la escuela (mismos roles que en el back)
export const EDTE_VIEWER_ROLES = [...EDTE_MANAGER_ROLES, 'TEACHER', 'PRECEPTOR']

// AAAA-MM-DD → DD/MM/AAAA
export const formatMeetingDate = (date: string) => date.split('-').reverse().join('/')

// Rutas del formulario de reunión. Con `studentId`, el formulario suma a ese alumno a la reunión
// (lo usa "Agregar a reunión" de la pantalla de derivados, CRM-074). El alumno se guarda desde el
// formulario: el PATCH de reuniones reemplaza la lista completa y podría pisar cambios
export const newMeetingPath = (studentId?: string) =>
  studentId ? `/edte-meetings/new?studentId=${studentId}` : '/edte-meetings/new'
export const editMeetingPath = (meetingId: string, studentId?: string) =>
  studentId
    ? `/edte-meetings/${meetingId}/edit?studentId=${studentId}`
    : `/edte-meetings/${meetingId}/edit`

// Un enlace solo se muestra como link si es http o https (por si hubiera datos viejos con otro
// protocolo, como javascript:, que ejecutaría código al hacer clic)
export const isSafeWebUrl = (value: string | null | undefined): value is string => {
  if (!value) return false
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

// Fecha de hoy en formato AAAA-MM-DD, con la hora local
const todayIso = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

// Por qué todavía no se puede firmar el acta (misma regla que el back): la reunión tiene que
// haber ocurrido. Devuelve null si se puede firmar (CRM-076).
export function getSignBlockedReason(date: string, today: string = todayIso()): string | null {
  if (date > today) return 'La reunión todavía no ocurrió: no se puede firmar el acta.'
  return null
}

// Fecha y hora de una firma en la zona horaria de la escuela, como DD/MM/AAAA HH:MM
export function formatSignedAt(value: string) {
  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''
  return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}`
}

// Estado de la firma de un convocado (CRM-076): solo firman los presentes
export const memberSignatureLabel = (member: { present: boolean; signedAt: string | null }) => {
  if (!member.present) return '—'
  return member.signedAt ? `Firmó el ${formatSignedAt(member.signedAt)}` : 'Pendiente'
}
