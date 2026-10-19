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

export interface RiteAttendanceTerm {
  schoolDays: number
  absences: number
}

export interface RiteNotification {
  term: RiteTerm
  status: RiteStatus
  signedAt: string | null
  signedBy: string | null
}

export interface RiteDocument {
  institution: { name: string; number: string; district: string }
  academicYear: number
  term: RiteTerm
  student: { id: string; firstName: string; lastName: string; dni: string; recordNumber: string }
  section: { grade: number; division: string; shift: Shift } | null
  subjects: RiteSubject[]
  attendance: {
    term1: RiteAttendanceTerm
    term2: RiteAttendanceTerm | null
    totalSchoolDays: number
    totalAbsences: number
  }
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

export function createRite(data: { studentId: string; year: number; term: RiteTerm }) {
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