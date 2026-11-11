import { fetchApi } from '@/services/api'
import type { ResultCode } from '@/services/intensification.service'

export type ScoreSlot = number | null

// Valoración parcial de cada cuatrimestre (pedido del equipo directivo, CRM-066)
export type PreliminaryAssessment = 'TEA' | 'TEP' | 'TED'

export interface RosterStudent {
  id: string
  dni: string
  lastName: string
  firstName: string
}

export interface RosterGrade {
  id: string
  term1Scores: ScoreSlot[] | null
  term2Scores: ScoreSlot[] | null
  preliminaryAssessment1: PreliminaryAssessment | null
  preliminaryAssessment2: PreliminaryAssessment | null
  term1Score: number | null
  term2Score: number | null
  // Nota con la que recuperó el 1.º cuatrimestre durante el 2.º (CRM-052)
  term1IntensificationScore: number | null
  finalScore: number | null
  subjectStatus: string
  term1Closed: boolean
  term2Closed: boolean
}

// Intento de intensificación de diciembre o febrero/marzo, para sus columnas en la grilla (CRM-066)
export type GridIntensificationPeriod = 'DECEMBER' | 'FEBRUARY_MARCH'

export interface RosterIntensification {
  id: string
  period: GridIntensificationPeriod
  resultCode: ResultCode | null
  score: number | null
  knowledgeAtClose: string | null
}

export interface RosterRow {
  id: string // enrollmentId
  student: RosterStudent
  subject: { id: string; name: string }
  grade: RosterGrade | null
  intensifications: RosterIntensification[]
}

export interface RosterParams {
  classSectionId: string
  subjectId: string
  year: number
}
// GET /api/grades
export function getGradeRoster(params: RosterParams, signal?: AbortSignal) {
  const query = new URLSearchParams({
    classSectionId: params.classSectionId,
    subjectId: params.subjectId,
    year: String(params.year),
  })
  return fetchApi<RosterRow[]>(`/api/grades/roster?${query.toString()}`, { signal })
}

// Solo se mandan los campos con valor: el back no acepta vacíos (null) en estos campos
export interface SaveGradeInput {
  enrollmentId: string
  term1Scores?: ScoreSlot[]
  term2Scores?: ScoreSlot[]
  preliminaryAssessment1?: PreliminaryAssessment
  term1Score?: number
  preliminaryAssessment2?: PreliminaryAssessment
  term2Score?: number
}

// POST /api/grades
export function saveGrade(input: SaveGradeInput) {
  const { enrollmentId, ...scores } = input
  return fetchApi<RosterGrade>('/api/grades', {
    method: 'POST',
    body: JSON.stringify({ enrollmentId, ...scores }),
  })
}

export interface StudentSubjectRow {
  id: string // enrollmentId
  subject: { id: string; name: string }
  grade: RosterGrade | null
}

// GET /api/grades/by-student?studentId=&year=
export function getGradesByStudent(studentId: string, year: number, signal?: AbortSignal) {
  const query = new URLSearchParams({ studentId, year: String(year) })
  return fetchApi<StudentSubjectRow[]>(`/api/grades/by-student?${query.toString()}`, { signal })
}
