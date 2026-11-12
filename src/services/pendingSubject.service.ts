import { fetchApi } from '@/services/api'

// Saberes pendientes de las MPAA (E3-RF-02, CRM-053)

export type PendingSubjectStatus = 'PENDING' | 'ACCREDITED'

export interface PendingSubject {
  id: string
  status: PendingSubjectStatus
  initialPendingKnowledge: string | null
  closingPendingKnowledge: string | null
  finalScore: number | null
  accreditedAt: string | null
  updatedAt: string
  subject: { id: string; name: string; gradeLevel: number }
  originAcademicYear: { id: string; year: number }
  // Año de la MPAA (CRM-097): el de la cursada de origen o, si no quedó guardado, el de la materia.
  // Opcional para tolerar un back sin actualizar
  gradeLevel?: number
}

// Un texto vacío borra el campo; si un campo no se manda, queda como estaba
export interface UpdatePendingKnowledgeInput {
  initialPendingKnowledge?: string | null
  closingPendingKnowledge?: string | null
}

// Este endpoint responde con el formato estándar { success, data, message }
interface ApiResponse<T> {
  data: T
}

const BASE = '/api/pending-subjects'

// Las MPAA del alumno, pendientes primero
export async function getStudentPendingSubjects(studentId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ studentId })
  const response = await fetchApi<ApiResponse<PendingSubject[]>>(`${BASE}?${query.toString()}`, {
    signal,
  })
  return response.data
}

// Guarda los saberes iniciales y/o de cierre de una MPAA
export async function updatePendingKnowledge(id: string, input: UpdatePendingKnowledgeInput) {
  const response = await fetchApi<ApiResponse<PendingSubject>>(`${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return response.data
}
