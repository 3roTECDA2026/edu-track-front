import { fetchApi } from '@/services/api'

// PROVISORIO (CRM-074): las reuniones del EDTE son de CRM-075 (front #77), que todavía no está en
// develop. Cuando se fusione, este archivo se borra y se usa `listEdteMeetings` de
// `services/edteMeeting.service.ts` y sus labels. El formulario de la reunión también tiene que
// leer `?studentId=` para sumar al alumno (ver CRM-074-plan, 4.6).

export type MeetingPeriod = 'FEBRUARY_MARCH' | 'AUGUST' | 'DECEMBER' | 'ADDITIONAL'

// Lo mínimo de una reunión que usa el diálogo
export interface DraftMeeting {
  id: string
  date: string // AAAA-MM-DD
  period: MeetingPeriod
  studentsCount: number
}

export const MEETING_PERIOD_LABELS: Record<MeetingPeriod, string> = {
  FEBRUARY_MARCH: 'Febrero / Marzo',
  AUGUST: 'Agosto',
  DECEMBER: 'Diciembre',
  ADDITIONAL: 'Adicional',
}

// Reuniones en borrador del ciclo: las únicas a las que todavía se pueden sumar alumnos
export function listDraftMeetings(year: number, signal?: AbortSignal) {
  return fetchApi<DraftMeeting[]>(`/api/edte-meetings?year=${year}&status=DRAFT`, { signal })
}

// El alumno se suma en el formulario de la reunión y se guarda desde ahí. No se guarda desde el
// listado: el PATCH de reuniones reemplaza la lista completa de alumnos y podría pisar cambios.
export const newMeetingPath = (studentId: string) => `/edte-meetings/new?studentId=${studentId}`
export const editMeetingPath = (meetingId: string, studentId: string) =>
  `/edte-meetings/${meetingId}/edit?studentId=${studentId}`

export const formatDate = (date: string) => date.split('-').reverse().join('/')
