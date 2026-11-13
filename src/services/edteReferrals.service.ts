import { fetchApi } from '@/services/api'
import type { Shift } from '@/services/students.service'

// Alumnos derivados al EDTE (E4-RF-02, CRM-074).
// El listado sale del back de CRM-073 (`/api/edte-referrals`), que lee las decisiones del motor de
// promoción (CRM-062). El estado del PATE sale de `/api/pates` (CRM-078). Si en la revisión de
// esos PR cambia el contrato, se ajustan solo los tipos de este archivo.

export interface ReferralSection {
  id: string
  grade: number
  division: string
  shift: Shift
}

export interface ReferralPendingSubject {
  pendingSubjectId: string
  subjectId: string
  subjectName: string
  gradeLevel: number
  originYear: number
}

export interface EdteReferral {
  decisionId: string
  decidedAt: string
  pendingCountAtDecision: number // MPAA que tenía cuando el motor lo derivó
  pendingCount: number // MPAA que sigue debiendo hoy
  student: { id: string; firstName: string; lastName: string; dni: string }
  section: ReferralSection | null // Curso en el ciclo que se cerró
  pendingSubjects: ReferralPendingSubject[]
}

export type PateStatus = 'DRAFT' | 'IN_PROGRESS' | 'CLOSED'

// Lo mínimo del PATE que usa esta pantalla
export interface PateSummary {
  id: string
  status: PateStatus
  student: { id: string }
}

// Derivados al cierre de `closedYear` (el ciclo que se cerró)
export function listEdteReferrals(closedYear: number, signal?: AbortSignal) {
  return fetchApi<EdteReferral[]>(`/api/edte-referrals?year=${closedYear}`, { signal })
}

// PATE del ciclo en que se aplican
export function listPatesByYear(year: number, signal?: AbortSignal) {
  return fetchApi<PateSummary[]>(`/api/pates?year=${year}`, { signal })
}
