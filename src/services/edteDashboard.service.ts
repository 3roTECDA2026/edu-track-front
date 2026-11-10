import { fetchApi } from '@/services/api'
import type { PreliminaryAssessment } from '@/services/studentProfile.service'
import type { Shift } from '@/services/students.service'

// Dashboard del EDTE (E4-RF-05, CRM-077)

export type DashboardTerm = 'FIRST' | 'SECOND'

// Semáforo de cada alumno: rojo, ámbar o verde
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export interface DashboardIndicators {
  totalStudents: number
  // Alumnos por su peor valoración del cuatrimestre; NONE = sin valoración cargada
  studentsByAssessment: Record<PreliminaryAssessment | 'NONE', number>
  earlyWarning: number // Alumnos con 4 MPAA: una más y se derivan
  referred: number // Alumnos con 5 o más MPAA: derivados al EDTE
  tedAssessments: number // Valoraciones TED (materias, no alumnos) del cuatrimestre
}

export interface DashboardStudent {
  id: string
  firstName: string
  lastName: string
  dni: string
  section: { id: string; grade: number; division: string; shift: Shift }
  assessment: PreliminaryAssessment | null
  tedCount: number
  pendingSubjectsCount: number
  level: RiskLevel
  // PATE en curso; hasta que esté CRM-078, el back devuelve siempre null
  pate: { id: string; status: string } | null
}

export interface EdteDashboard {
  academicYear: number
  term: DashboardTerm
  indicators: DashboardIndicators
  students: DashboardStudent[]
}

export interface DashboardFilters {
  term?: DashboardTerm
  assessment?: PreliminaryAssessment
  grade?: number
  classSectionId?: string
}

export function getEdteDashboard(filters: DashboardFilters, signal?: AbortSignal) {
  const params = new URLSearchParams()
  if (filters.term) params.set('term', filters.term)
  if (filters.assessment) params.set('assessment', filters.assessment)
  if (filters.grade !== undefined) params.set('grade', String(filters.grade))
  if (filters.classSectionId) params.set('classSectionId', filters.classSectionId)
  const query = params.toString()
  return fetchApi<EdteDashboard>(query ? `/api/edte-dashboard?${query}` : '/api/edte-dashboard', {
    signal,
  })
}
