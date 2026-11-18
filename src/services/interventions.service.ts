import { fetchApi, fetchApiBlob } from '@/services/api'

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

// Una intervención tal como la devuelve el listado: suma el autor, el curso y cuántos adjuntos
// tiene (CRM-088).
export interface InterventionListItem extends Intervention {
  author: InterventionAuthor
  classSection: { id: string; grade: number; division: string; shift: string } | null
  _count?: { attachments: number }
}

// Forma del listado paginado del back (que a su vez viene dentro de { success, data, message }).
interface PaginatedInterventions {
  data: InterventionListItem[]
  page: number
  limit: number
  total: number
  totalPages: number
}

// Filtros de la línea de tiempo (CRM-088). Las fechas van como AAAA-MM-DD, inclusive.
export interface InterventionFilters {
  eventType?: InterventionEventType
  from?: string
  to?: string
}

// Parámetros de la consulta: alumno + filtros elegidos. Los mismos para el listado y el PDF.
export function buildInterventionParams(
  studentId: string,
  filters: InterventionFilters
): URLSearchParams {
  const params = new URLSearchParams({ studentId })
  if (filters.eventType) params.set('eventType', filters.eventType)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  return params
}

// Máximo que devuelve el back por pedido: la ficha muestra las más recientes hasta ese número.
export const INTERVENTIONS_PAGE_LIMIT = 100

// Intervenciones de un alumno, de la más reciente a la más vieja (el back ordena por fecha).
// Devuelve también el total, para avisar si hay más de las que se muestran.
export async function listStudentInterventions(
  studentId: string,
  filters: InterventionFilters = {},
  signal?: AbortSignal
): Promise<{ items: InterventionListItem[]; total: number }> {
  const params = buildInterventionParams(studentId, filters)
  params.set('limit', String(INTERVENTIONS_PAGE_LIMIT))
  const res = await fetchApi<{ data: PaginatedInterventions }>(
    `/api/interventions?${params.toString()}`,
    { signal }
  )
  return { items: res.data.data, total: res.data.total }
}

// PDF de la línea de tiempo con los filtros aplicados (CRM-088). Se pide con token.
export function downloadInterventionTimelinePdf(
  studentId: string,
  filters: InterventionFilters
): Promise<Blob> {
  const params = buildInterventionParams(studentId, filters)
  return fetchApiBlob(`/api/interventions/export/pdf?${params.toString()}`)
}

// ---- Adjuntos (CRM-087) ----

// Un adjunto tal como lo devuelve el back (sin la ruta interna donde se guarda el archivo).
export interface InterventionAttachment {
  id: string
  interventionId: string
  originalName: string
  mimeType: string
  size: number // en bytes
  createdAt: string
  uploadedBy: InterventionAuthor
}

// Sube uno o varios archivos. Van en un FormData con el campo "files", que es el que espera
// el back (multer). Puede hacerlo el autor de la intervención, dentro de las 48 hs.
export async function uploadInterventionAttachments(
  interventionId: string,
  files: File[]
): Promise<InterventionAttachment[]> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  const res = await fetchApi<{ data: InterventionAttachment[] }>(
    `/api/interventions/${encodeURIComponent(interventionId)}/attachments`,
    { method: 'POST', body: formData }
  )
  return res.data
}

// Lista los adjuntos de una intervención.
export async function listInterventionAttachments(
  interventionId: string,
  signal?: AbortSignal
): Promise<InterventionAttachment[]> {
  const res = await fetchApi<{ data: InterventionAttachment[] }>(
    `/api/interventions/${encodeURIComponent(interventionId)}/attachments`,
    { signal }
  )
  return res.data
}

// Trae el archivo de un adjunto (con el token), para descargarlo o verlo.
export function downloadInterventionAttachment(
  interventionId: string,
  attachmentId: string
): Promise<Blob> {
  return fetchApiBlob(
    `/api/interventions/${encodeURIComponent(interventionId)}/attachments/${encodeURIComponent(attachmentId)}`
  )
}
