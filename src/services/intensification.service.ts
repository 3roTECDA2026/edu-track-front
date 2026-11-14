import { fetchApi, fetchApiBlob } from '@/services/api'
import type { IntensificationPeriod } from '@/services/intensificationSchedule.service'

// Los textos de los modelos, períodos y resultados están en
// components/intensification/intensificationLabels.ts

export type IntensificationModel = 'MODEL_1' | 'MODEL_2' | 'MODEL_3' | 'MODEL_4'
export type ResultCode = 'AA' | 'CCA' | 'CSA'

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
  pendingKnowledge: string | null // Saberes que le quedan pendientes
  knowledgeAtClose: string | null // Logros o saberes alcanzados
  evaluationDate: string | null
}

// Alumno que tiene la materia pendiente y todavía no está asignado al período
export interface IntensificationCandidate {
  pendingSubjectId: string
  student: IntensificationStudent
  course: SectionRef | null
  originYear: number
  pendingKnowledge: string | null
}

// Resultado de la intensificación (CRM-058)
export interface RegisterResultInput {
  resultCode: ResultCode
  score: number | null
  knowledgeAtClose: string | null
  pendingKnowledge?: string | null
  evaluationDate?: string // Fecha del examen (AAAA-MM-DD); si no viene, el back usa la de carga
}

// Evidencia adjunta a un intento (CRM-060). El back responde el objeto directo, sin { data }
export interface IntensificationAttachment {
  id: string
  intensificationId: string
  originalName: string
  mimeType: string
  size: number // en bytes
  createdAt: string
  uploadedBy: { id: string; firstName: string; lastName: string }
}

// Quién puede quitar una evidencia: por ahora solo dirección (igual que ATTACHMENT_DELETE_ROLES
// en el back, que es quien lo valida)
export const ATTACHMENT_DELETE_ROLES = ['SCHOOL_MANAGEMENT']

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

  // Carga del resultado: docente responsable, dirección o administración (CRM-058)
  registerResult: (id: string, data: RegisterResultInput) =>
    fetchApi<IntensificationAssignment>(`${BASE}/${id}/result`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // ---- Evidencias del intento (CRM-060) ----

  // Van en un FormData con el campo "files", el que espera el back (multer)
  uploadAttachments: (id: string, files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    return fetchApi<IntensificationAttachment[]>(`${BASE}/${encodeURIComponent(id)}/attachments`, {
      method: 'POST',
      body: formData,
    })
  },

  listAttachments: (id: string, signal?: AbortSignal) =>
    fetchApi<IntensificationAttachment[]>(`${BASE}/${encodeURIComponent(id)}/attachments`, {
      signal,
    }),

  // El archivo, pedido con el token (un <a href> no lo manda)
  downloadAttachment: (id: string, attachmentId: string) =>
    fetchApiBlob(
      `${BASE}/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}`
    ),

  // Baja lógica: queda registrado quién la quitó (solo dirección)
  deleteAttachment: (id: string, attachmentId: string) =>
    fetchApi<{ deleted: boolean }>(
      `${BASE}/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}`,
      { method: 'DELETE' }
    ),
}
