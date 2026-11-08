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

// El plan del alumno (en cualquier estado), o null si nunca estuvo en el programa
export async function getStudentFortePlan(studentId: string, signal?: AbortSignal) {
  const plans = await fetchApi<FortePlan[]>(`/api/forte-plans?studentId=${studentId}&status=ALL`, {
    signal,
  })
  return plans[0] ?? null
}

export function getFortePlanReports(planId: string, signal?: AbortSignal) {
  return fetchApi<FortePlanReport[]>(`/api/forte-plans/${planId}/reports`, { signal })
}

export function createFortePlanReport(planId: string, input: CreateFortePlanReportInput) {
  return fetchApi<FortePlanReport>(`/api/forte-plans/${planId}/reports`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
