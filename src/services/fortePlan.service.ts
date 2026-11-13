import { fetchApi } from '@/services/api'

// Plan Forte (E4-RF-14, CRM-089)

export type FortePlanStatus = 'ACTIVE' | 'COMPLETED' | 'WITHDRAWN'

export interface FortePlan {
  id: string
  student: { id: string; firstName: string; lastName: string; dni: string }
  pedagogicalGoals: string
  assignedAt: string
  status: FortePlanStatus
  responsible: { id: string; name: string } | null
  lastReportAt: string | null
  updatedAt: string
}

export interface FortePlanReport {
  id: string
  date: string
  progress: string // Evolución
  observations: string | null
  author: { id: string; name: string } | null
  createdAt: string
}

export interface CreateFortePlanReportInput {
  progress: string
  observations: string | null
  date?: string // AAAA-MM-DD; si no va, el back usa la de hoy
}

export interface CreateFortePlanInput {
  studentId: string
  responsibleId: string
  pedagogicalGoals: string
}

export interface UpdateFortePlanInput {
  pedagogicalGoals?: string
  responsibleId?: string
  status?: FortePlanStatus
}

const BASE = '/api/forte-plans'

// El plan del alumno (en cualquier estado), o null si nunca estuvo en el programa
export async function getStudentFortePlan(studentId: string, signal?: AbortSignal) {
  const plans = await fetchApi<FortePlan[]>(`${BASE}?studentId=${studentId}&status=ALL`, {
    signal,
  })
  return plans[0] ?? null
}

// Asigna al alumno (o lo vuelve a asignar, si ya tuvo un plan)
export function createFortePlan(input: CreateFortePlanInput) {
  return fetchApi<FortePlan>(BASE, { method: 'POST', body: JSON.stringify(input) })
}

// Cambia los objetivos, el responsable o el estado (finalizar o dar de baja)
export function updateFortePlan(id: string, input: UpdateFortePlanInput) {
  return fetchApi<FortePlan>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
}

export function getFortePlanReports(planId: string, signal?: AbortSignal) {
  return fetchApi<FortePlanReport[]>(`${BASE}/${planId}/reports`, { signal })
}

export function createFortePlanReport(planId: string, input: CreateFortePlanReportInput) {
  return fetchApi<FortePlanReport>(`${BASE}/${planId}/reports`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// Docentes que pueden ser responsables del seguimiento (dirección, EOE y administración)
export interface ForteResponsible {
  id: string
  name: string
}

export function getForteResponsibles(signal?: AbortSignal) {
  return fetchApi<ForteResponsible[]>(`${BASE}/responsibles`, { signal })
}
