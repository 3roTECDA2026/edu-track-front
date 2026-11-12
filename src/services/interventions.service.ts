import { fetchApi } from '@/services/api'

// Tipos de evento (coinciden con el enum del back).
export type InterventionEventType = 'PEDAGOGICAL' | 'CONDUCT' | 'HEALTH'

export interface CreateInterventionInput {
  studentId: string
  classSectionId: string
  eventType: InterventionEventType
  description: string // situación detectada
  interventionProposal?: string // propuesta de intervención
  involvedActors?: string // actores involucrados
  date?: string // fecha del suceso (ISO); si no va, el back usa hoy
}

export interface Intervention {
  id: string
  studentId: string
  classSectionId: string | null
  authorId: string
  eventType: InterventionEventType
  description: string
  interventionProposal: string | null
  involvedActors: string | null
  date: string
  createdAt: string
}

// Crear una intervención.
export async function createIntervention(input: CreateInterventionInput): Promise<Intervention> {
  const res = await fetchApi<{ data: Intervention }>('/api/interventions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return res.data
}

export interface InterventionAuthor {
  id: string
  firstName: string
  lastName: string
}

// Una intervención tal como la devuelve el listado: suma el autor con su nombre.
export interface InterventionListItem extends Intervention {
  author: InterventionAuthor
}

// Forma del listado paginado del back (que a su vez viene dentro de { success, data, message }).
interface PaginatedInterventions {
  data: InterventionListItem[]
  page: number
  limit: number
  total: number
  totalPages: number
}

// Intervenciones de un alumno, de la más reciente a la más vieja.
// El back ordena por fecha desc; pedimos un límite alto para traerlas todas en la ficha.
export async function listStudentInterventions(
  studentId: string,
  signal?: AbortSignal
): Promise<InterventionListItem[]> {
  const res = await fetchApi<{ data: PaginatedInterventions }>(
    `/api/interventions?studentId=${encodeURIComponent(studentId)}&limit=100`,
    { signal }
  )
  return res.data.data
}
