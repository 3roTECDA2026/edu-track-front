import { fetchApi } from '@/services/api'

export interface LegalConflict {
  id: string
  studentId: string
  conflictCode: string
  occurrenceDate: string | null
  registeredAt: string
  documentUuid: string
  // Hash de integridad (CRM-093); null en actas anteriores a ese ticket
  digitalSignHash: string | null
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

export async function createLegalConflict(input: CreateLegalConflictInput): Promise<LegalConflict> {
  const response = await fetchApi<ConflictResponse<LegalConflict>>('/api/legal-conflicts', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(input),
  })

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

export async function getConflictCodes(signal?: AbortSignal): Promise<ConflictCode[]> {
  const response = await fetchApi<ConflictResponse<ConflictCode[]>>('/api/legal-conflicts/codes', {
    signal,
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-store',
    },
  })

  return response.data
}

// CRM-092: consulta de conflictos y anexos permanentes.
export interface LegalConflictAttachment {
  id: string
  conflictId: string
  authorId: string
  author?: {
    firstName: string
    lastName: string
  } | null
  content: string
  date: string
  // CRM-093: identificador y hash de integridad del anexo (null en anexos anteriores)
  documentUuid: string
  digitalSignHash: string | null
}

export interface LegalConflictDetail extends LegalConflict {
  attachments: LegalConflictAttachment[]
  electronicSignature?: unknown
}

export async function getLegalConflictDetail(id: string): Promise<LegalConflictDetail> {
  const response = await fetchApi<ConflictResponse<LegalConflictDetail>>(
    `/api/legal-conflicts/${encodeURIComponent(id)}`,
    { cache: 'no-store' }
  )
  return response.data
}

export async function createLegalConflictAttachment(
  id: string,
  content: string
): Promise<LegalConflictAttachment> {
  const response = await fetchApi<ConflictResponse<LegalConflictAttachment>>(
    `/api/legal-conflicts/${encodeURIComponent(id)}/attachments`,
    {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({ content }),
    }
  )
  return response.data
}

// ---- Integridad del acta (CRM-093, E4-RF-17) ----

export type IntegrityStatus = 'INTACT' | 'ALTERED' | 'NOT_HASHED'
export type IntegrityReason = 'CONTENT_CHANGED' | 'UNREADABLE' | 'AUDIT_LOG_MISMATCH'
export type SignatureStatus = 'MATCH' | 'MISMATCH' | 'UNSIGNED'

export interface AttachmentIntegrity {
  id: string
  documentUuid: string
  status: IntegrityStatus
  reasons: IntegrityReason[]
}

export interface ConflictVerification {
  conflictId: string
  documentUuid: string
  status: IntegrityStatus // resultado general: acta, anexos y firma
  conflictStatus: IntegrityStatus // solo el acta
  storedHash: string | null
  calculatedHash: string | null
  reasons: IntegrityReason[]
  signature: { status: SignatureStatus; signedAt: string | null }
  attachments: AttachmentIntegrity[]
  verifiedAt: string
}

// Recalcula en el back los hashes del acta y de sus anexos
export async function verifyLegalConflict(id: string): Promise<ConflictVerification> {
  const response = await fetchApi<ConflictResponse<ConflictVerification>>(
    `/api/legal-conflicts/${encodeURIComponent(id)}/verify`,
    { cache: 'no-store' }
  )
  return response.data
}
