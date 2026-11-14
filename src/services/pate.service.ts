import { fetchApi } from '@/services/api'
import type { Shift } from '@/services/students.service'

// Servicios para la gestión de PATE (E4-RF-06, CRM-078 / CRM-079)

export type IntensificationModel = 'MODEL_1' | 'MODEL_2' | 'MODEL_3' | 'MODEL_4'
export type PateStatus = 'DRAFT' | 'IN_PROGRESS' | 'CLOSED'

export interface PatePendingSubjectOption {
  pendingSubjectId: string
  subjectId: string
  subjectName: string
  gradeLevel: number
  originYear: number
}

export interface PateSectionOption {
  id: string
  grade: number
  division: string
  shift: Shift
}

export interface PateOptionsResponse {
  year: number
  referred: boolean
  existingPate: { id: string; status: PateStatus } | null
  pendingSubjects: PatePendingSubjectOption[]
  sections: PateSectionOption[]
  organizationalOption: string | null
  allowedModels: IntensificationModel[]
  studentShift: Shift | null
  currentSubjectsCount: number
  maxSubjectsPerCycle: number
}

export interface PateSubjectToIntensifyInput {
  pendingSubjectId: string
  model: IntensificationModel
  targetClassSectionId?: string | null
}

export interface PateSubjectToRepeatInput {
  pendingSubjectId: string
  classSectionId: string
}

export interface CreatePatePayload {
  studentId: string
  edteMeetingId: string
  diagnosis: string
  supportStrategies: string
  schedule?: string | null
  subjectsToIntensify: PateSubjectToIntensifyInput[]
  subjectsToRepeat: PateSubjectToRepeatInput[]
}

export interface PateResponse {
  id: string
  year: number
  status: PateStatus
  student: {
    id: string
    firstName: string
    lastName: string
    dni: string
  }
  edteMeeting: {
    id: string
    date: string
    period: string
  } | null
  diagnosis: string | null
  supportStrategies: string | null
  schedule: string | null
  notificationUrl: string | null
  createdBy: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

const BASE = '/api/pates'

export function getPateOptions(
  studentId: string,
  edteMeetingId?: string,
  signal?: AbortSignal
): Promise<PateOptionsResponse> {
  const params = new URLSearchParams({ studentId })
  if (edteMeetingId) {
    params.set('edteMeetingId', edteMeetingId)
  }
  return fetchApi<PateOptionsResponse>(`${BASE}/options?${params.toString()}`, { signal })
}

export function createPate(
  payload: CreatePatePayload,
  signal?: AbortSignal
): Promise<PateResponse> {
  return fetchApi<PateResponse>(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  })
}
