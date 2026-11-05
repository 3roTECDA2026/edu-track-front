import { fetchApi } from '@/services/api'
import type { PreliminaryAssessment } from '@/services/studentProfile.service'
import type { Shift } from '@/services/students.service'

export type RiteTerm = 'FIRST' | 'SECOND'
export type RiteStatus = 'DRAFT' | 'CLOSED' | 'SIGNED'

export interface RiteSummary {
  id: string
  studentId: string
  academicYearId: string
  academicYear: number
  term: RiteTerm
  isPostIntensification: boolean
  status: RiteStatus
  generalNotes: string | null
  signedAt: string | null
  signedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface RiteTermData {
  preliminaryAssessment: PreliminaryAssessment | null
  score: number | null
  observations: string | null
}

export interface RiteSubject {
  enrollmentId: string
  type: 'C' | 'R'
  subjectName: string
  gradeLevel: number
  term1: RiteTermData
  term2: RiteTermData | null
  intensification: { december: number | null; february: number | null } | null
  finalScore: number | null
}

// Asistencia de un cuatrimestre. Los campos opcionales no existen en los RITE firmados
// antes de que se agregaran (su copia fija quedó con el formato anterior).
export interface RiteAttendanceTerm {
  schoolDays: number // Días hábiles (los del modal, o los días con asistencia si no se cargaron)
  absences: number // Inasistencias en peso (1, ½ y ¼), justificadas y sin justificar
  attendances?: number // Días en que el alumno vino (presente o con retardo)
  justifiedAbsences?: number
  unjustifiedAbsences?: number
}

export interface RiteAttendance {
  term1: RiteAttendanceTerm
  term2: RiteAttendanceTerm | null
  totalSchoolDays: number
  totalAbsences: number
  totalAttendances?: number
  totalJustifiedAbsences?: number
  totalUnjustifiedAbsences?: number
}

// isPostIntensification es opcional: los RITE firmados antes guardaron la copia fija sin ese dato.
export interface RiteNotification {
  term: RiteTerm
  isPostIntensification?: boolean
  status: RiteStatus
  signedAt: string | null
  signedBy: string | null
}

export interface RiteDocument {
  institution: { name: string; number: string; district: string }
  academicYear: number
  term: RiteTerm
  isPostIntensification?: boolean
  student: { id: string; firstName: string; lastName: string; dni: string; recordNumber: string }
  section: { grade: number; division: string; shift: Shift } | null
  subjects: RiteSubject[]
  attendance: RiteAttendance
  generalNotes: string | null
  notifications: RiteNotification[]
}

export interface RiteDetail {
  rite: RiteSummary
  document: RiteDocument
}

// Todas las funciones usan fetchApi, que agrega el token del usuario logueado.

export function getStudentRites(studentId: string, signal?: AbortSignal) {
  return fetchApi<RiteSummary[]>(`/api/rites?studentId=${studentId}`, { signal })
}

export function getRite(id: string, signal?: AbortSignal) {
  return fetchApi<RiteDetail>(`/api/rites/${id}`, { signal })
}

// El RITE post-intensificación (E2-RF-12) se crea con term SECOND e isPostIntensification true.
export function createRite(data: {
  studentId: string
  year: number
  term: RiteTerm
  isPostIntensification?: boolean
}) {
  return fetchApi<RiteDetail>('/api/rites', { method: 'POST', body: JSON.stringify(data) })
}

export function updateRiteNotes(id: string, generalNotes: string) {
  return fetchApi<RiteDetail>(`/api/rites/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ generalNotes }),
  })
}

export function closeRite(id: string) {
  return fetchApi<RiteDetail>(`/api/rites/${id}/close`, { method: 'PATCH' })
}

export function reopenRite(id: string) {
  return fetchApi<RiteDetail>(`/api/rites/${id}/reopen`, { method: 'PATCH' })
}

// El back usa el token del usuario logueado para registrar quién firma.
export function signRite(id: string) {
  return fetchApi<RiteDetail>(`/api/rites/${id}/sign`, { method: 'PATCH' })
}
