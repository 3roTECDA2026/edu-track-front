import { fetchApi } from '@/services/api'
import type { Shift } from '@/services/students.service'

// Recursado de materias (CRM-082, E4-RF-09). El back responde { success, data, message }.

export interface RepeatSection {
  id: string
  grade: number
  division: string
  shift: Shift
}

export interface SubjectRepeat {
  id: string
  student: { id: string; dni: string; firstName: string; lastName: string }
  subject: { id: string; name: string; gradeLevel: number }
  classSection: RepeatSection
  academicYear: { id: string; year: number }
  // MPAA que se recursa
  pendingSubject: { id: string; status: 'PENDING' | 'ACCREDITED'; originYear: number } | null
  // Si tiene notas o asistencia ya no se puede quitar
  hasGrade: boolean
  attendanceCount: number
  // PATE que lo creó al confirmarse (CRM-078), o null si se asignó a mano
  pateId: string | null
}

export interface RepeatOption {
  pendingSubjectId: string
  subject: { id: string; name: string }
  originYear: number
  gradeLevel: number
  currentRepeat: { id: string; subjectId: string; classSection: RepeatSection } | null
  // Por qué no se puede recursar (ya acreditada, intensificación sin resultado...), o null
  blockReason: string | null
  // Secciones del ciclo activo del año de la materia (pueden ser de otro turno: contraturno)
  sections: RepeatSection[]
}

export interface RepeatOptions {
  activeCycle: { id: string; year: number }
  // Materias del alumno en el ciclo activo (cursadas + recursadas) y el máximo (12, E3-RF-13)
  subjectCount: number
  maxSubjects: number
  options: RepeatOption[]
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

const BASE = '/api/subject-repeats'

export async function listStudentRepeats(studentId: string, signal?: AbortSignal) {
  const response = await fetchApi<ApiResponse<SubjectRepeat[]>>(
    `${BASE}?studentId=${encodeURIComponent(studentId)}`,
    { signal }
  )
  return response.data
}

export async function getRepeatOptions(studentId: string, signal?: AbortSignal) {
  const response = await fetchApi<ApiResponse<RepeatOptions>>(
    `${BASE}/options?studentId=${encodeURIComponent(studentId)}`,
    { signal }
  )
  return response.data
}

export async function createRepeat(input: { pendingSubjectId: string; classSectionId: string }) {
  const response = await fetchApi<ApiResponse<SubjectRepeat>>(BASE, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return response.data
}

// Solo cambia la sección: las notas y la asistencia se conservan
export async function updateRepeatSection(id: string, classSectionId: string) {
  const response = await fetchApi<ApiResponse<SubjectRepeat>>(`${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ classSectionId }),
  })
  return response.data
}

export async function deleteRepeat(id: string) {
  await fetchApi<ApiResponse<{ deleted: true }>>(`${BASE}/${id}`, { method: 'DELETE' })
}
