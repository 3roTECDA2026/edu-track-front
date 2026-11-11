import { fetchApi } from '@/services/api'

export interface Pate {
  id: string
  studentId: string
  academicYearId: string
  diagnosis: string
  supportStrategies: string
  schedule?: string | null
  status: string
  year?: string
  student?: { firstName?: string; lastName?: string; dni?: string }
  subjectsToIntensify?: { id: string; subjectName: string; model: string; targetClassSection?: any }[]
  subjectsToRepeat?: { id: string; subjectName: string; classSection?: any }[]
}

export async function listPates(params?: { studentId?: string; academicYearId?: string }): Promise<Pate[]> {
  const qs = new URLSearchParams(params as any).toString()
  return (await fetchApi<Pate[]>(`/api/pates${qs ? '?' + qs : ''}`)) ?? []
}

export async function getPate(id: string): Promise<Pate> {
  return await fetchApi<Pate>(`/api/pates/${id}`)
}

export async function createPate(input: any): Promise<Pate> {
  return await fetchApi<Pate>('/api/pates', { method: 'POST', body: JSON.stringify(input) })
}

export async function updatePate(id: string, input: any): Promise<Pate> {
  return await fetchApi<Pate>(`/api/pates/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
}

export async function changePateStatus(id: string, status: string): Promise<Pate> {
  return await fetchApi<Pate>(`/api/pates/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
}
