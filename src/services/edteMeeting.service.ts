import { fetchApi } from '@/services/api'
import type { Shift } from '@/services/students.service'
import type { BackendRole } from '@/services/users.service'

// Reuniones del EDTE (E4-RF-03, CRM-075)

export type EdteMeetingPeriod = 'FEBRUARY_MARCH' | 'AUGUST' | 'DECEMBER' | 'ADDITIONAL'
export type EdteMeetingStatus = 'DRAFT' | 'SIGNED'

interface SectionInfo {
  id: string
  grade: number
  division: string
  shift: Shift
}

// Fila del listado
export interface EdteMeetingSummary {
  id: string
  year: number
  date: string // AAAA-MM-DD
  period: EdteMeetingPeriod
  shift: Shift | null
  status: EdteMeetingStatus
  minutesUrl: string | null
  membersCount: number
  presentCount: number
  studentsCount: number
  signedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface EdteMeetingMember {
  userId: string
  name: string
  role: BackendRole
  roleInMeeting: string | null // Rol con el que participó, guardado al cargar la reunión
  present: boolean
}

// PATE armado en la reunión (CRM-078)
export interface EdteMeetingPate {
  id: string
  status: string
}

export interface EdteMeetingStudent {
  studentId: string
  firstName: string
  lastName: string
  dni: string
  section: SectionInfo | null
  pendingSubjectsCount: number
  notes: string | null
  pate: EdteMeetingPate | null
}

export interface EdteMeetingDetail extends EdteMeetingSummary {
  considerations: string | null
  createdBy: { id: string; name: string } | null
  signedBy: { id: string; name: string } | null
  members: EdteMeetingMember[]
  students: EdteMeetingStudent[]
}

// Alumno que se puede tratar en la reunión: derivado al EDTE o con PATE en curso
export interface EdteMeetingCandidate {
  studentId: string
  firstName: string
  lastName: string
  dni: string
  section: SectionInfo | null
  pendingSubjectsCount: number
  referred: boolean
  pate: EdteMeetingPate | null
}

// Personal que se puede convocar
export interface EdteMeetingMemberOption {
  userId: string
  name: string
  role: BackendRole
}

export interface EdteMeetingInput {
  year: number
  date: string
  period: EdteMeetingPeriod
  shift: Shift | null
  considerations: string | null
  minutesUrl: string | null
  members: { userId: string; present: boolean }[]
  students: { studentId: string; notes: string | null }[]
}

// En la edición no se cambia el ciclo
export type UpdateEdteMeetingInput = Partial<Omit<EdteMeetingInput, 'year'>>

export interface ListEdteMeetingsFilters {
  year?: number
  period?: EdteMeetingPeriod
  status?: EdteMeetingStatus
}

const BASE = '/api/edte-meetings'

export function listEdteMeetings(filters: ListEdteMeetingsFilters, signal?: AbortSignal) {
  const params = new URLSearchParams()
  if (filters.year !== undefined) params.set('year', String(filters.year))
  if (filters.period) params.set('period', filters.period)
  if (filters.status) params.set('status', filters.status)
  const query = params.toString()
  return fetchApi<EdteMeetingSummary[]>(query ? `${BASE}?${query}` : BASE, { signal })
}

export function getEdteMeeting(id: string, signal?: AbortSignal) {
  return fetchApi<EdteMeetingDetail>(`${BASE}/${id}`, { signal })
}

export function getEdteMeetingCandidates(
  year: number,
  period: EdteMeetingPeriod,
  signal?: AbortSignal
) {
  return fetchApi<EdteMeetingCandidate[]>(`${BASE}/candidates?year=${year}&period=${period}`, {
    signal,
  })
}

export function getEdteMeetingMemberOptions(signal?: AbortSignal) {
  return fetchApi<EdteMeetingMemberOption[]>(`${BASE}/member-options`, { signal })
}

export function createEdteMeeting(input: EdteMeetingInput) {
  return fetchApi<EdteMeetingDetail>(BASE, { method: 'POST', body: JSON.stringify(input) })
}

export function updateEdteMeeting(id: string, input: UpdateEdteMeetingInput) {
  return fetchApi<EdteMeetingDetail>(`${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function signEdteMeeting(id: string) {
  return fetchApi<EdteMeetingDetail>(`${BASE}/${id}/sign`, { method: 'PATCH' })
}
