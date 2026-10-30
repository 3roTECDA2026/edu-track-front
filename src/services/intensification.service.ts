import { fetchApi } from '@/services/api'
import type { IntensificationPeriod } from '@/services/intensificationSchedule.service'

export type IntensificationModel = 'MODEL_1' | 'MODEL_2' | 'MODEL_3' | 'MODEL_4'
export type ResultCode = 'AA' | 'CCA' | 'CSA'

// Modelos de intensificación (E3-RF-06)
export const MODEL_LABELS: Record<IntensificationModel, string> = {
  MODEL_1: 'Modelo 1 · Materia del año siguiente',
  MODEL_2: 'Modelo 2 · Misma materia, mismo turno',
  MODEL_3: 'Modelo 3 · Misma materia, contraturno',
  MODEL_4: 'Modelo 4 · Espacio específico',
}

// En los modelos 2 y 3 hay que indicar el año, la sección y el turno donde intensifica (E3-RF-07)
export const MODELS_WITH_LOCATION: IntensificationModel[] = ['MODEL_2', 'MODEL_3']

export interface SectionRef {
  id: string
  grade: number
  division: string
  shift: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'EXTRA_TIME'
}

export interface IntensificationStudent {
  id: string
  firstName: string
  lastName: string
  dni: string
}

// Un alumno asignado a un período de intensificación
export interface IntensificationAssignment {
  id: string
  pendingSubjectId: string | null
  student: IntensificationStudent
  subject: { id: string; name: string; gradeLevel: number }
  course: SectionRef | null
  period: IntensificationPeriod
  model: IntensificationModel
  targetClassSection: SectionRef | null
  responsibleTeacher: { id: string; name: string } | null
  resultCode: ResultCode | null
  score: number | null
}

// Alumno que tiene la materia pendiente y todavía no está asignado al período
export interface IntensificationCandidate {
  pendingSubjectId: string
  student: IntensificationStudent
  course: SectionRef | null
  originYear: number
  pendingKnowledge: string | null
}

const BASE = '/api/intensifications'

export const intensificationService = {
  list: (
    params: { scheduleId: string; subjectId?: string; classSectionId?: string },
    signal?: AbortSignal
  ) => {
    const query = new URLSearchParams({ scheduleId: params.scheduleId })
    if (params.subjectId) query.set('subjectId', params.subjectId)
    if (params.classSectionId) query.set('classSectionId', params.classSectionId)
    return fetchApi<IntensificationAssignment[]>(`${BASE}?${query.toString()}`, { signal })
  },

  candidates: (params: { scheduleId: string; subjectId: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams(params)
    return fetchApi<IntensificationCandidate[]>(`${BASE}/candidates?${query.toString()}`, {
      signal,
    })
  },

  assign: (data: {
    scheduleId: string
    subjectId: string
    pendingSubjectIds: string[]
    model: IntensificationModel
    targetClassSectionId: string | null
  }) => fetchApi<{ assigned: number }>(BASE, { method: 'POST', body: JSON.stringify(data) }),

  updatePlacement: (
    id: string,
    data: { model: IntensificationModel; targetClassSectionId: string | null }
  ) =>
    fetchApi<IntensificationAssignment>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (id: string) => fetchApi<{ deleted: boolean }>(`${BASE}/${id}`, { method: 'DELETE' }),
}
