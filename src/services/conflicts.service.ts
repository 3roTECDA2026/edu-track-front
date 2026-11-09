import { fetchApi } from '@/services/api'

export interface LegalConflict {
  id: string
  studentId: string
  conflictCode: string
  occurrenceDate: string | null
  registeredAt: string
  documentUuid: string
  detailedReport: string
  editLocked: boolean
}

export interface CreateLegalConflictInput {
  studentId: string
  conflictCode: string
  occurrenceDate: string
  detailedReport: string
}

interface ConflictResponse<T> {
  success: boolean
  data: T
}

export async function createLegalConflict(
  input: CreateLegalConflictInput
): Promise<LegalConflict> {
  const response = await fetchApi<ConflictResponse<LegalConflict>>(
    '/api/legal-conflicts',
    {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify(input),
    }
  )

  return response.data
}

export async function getStudentLegalConflicts(
  studentId: string,
  signal?: AbortSignal
): Promise<LegalConflict[]> {
  const response = await fetchApi<ConflictResponse<LegalConflict[]>>(
    `/api/legal-conflicts/student/${encodeURIComponent(studentId)}`,
    {
      signal,
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )

  return response.data
}


// CRM-091: catálogo normalizado de conflictos
export interface ConflictCode {
  code: string
  description: string
}

export async function getConflictCodes(
  signal?: AbortSignal
): Promise<ConflictCode[]> {
  const response = await fetchApi<ConflictResponse<ConflictCode[]>>(
    '/api/legal-conflicts/codes',
    {
      signal,
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )

  return response.data
}
