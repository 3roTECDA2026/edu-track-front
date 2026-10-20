import { fetchApi } from '@/services/api'

export type AttendanceValue = 'PRESENT' | 'ABSENT' | 'HALF' | 'QUARTER'

// Un registro de la carga diaria
export interface AttendanceEntry {
  studentId: string
  value: AttendanceValue
  // true para la J del wireframe: una falta (ABSENT) marcada como justificada
  justified?: boolean
}

export interface DailyAttendanceRecord {
  id: string
  studentId: string
  date: string
  value: AttendanceValue
  justified: boolean
  justification: string | null
}

export interface AttendanceStudent {
  id: string
  dni: string
  lastName: string
  firstName: string
}

// Alumnos de la sección y asistencia ya registrada en la fecha consultada
export interface SectionAttendanceResponse {
  students: AttendanceStudent[]
  records: DailyAttendanceRecord[]
}

export interface AttendanceSection {
  id: string
  year: number
  grade: number
  division: string
  shift: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'EXTRA_TIME'
}

// Una fila del resumen: total de clases = presentes + ausentes + justificadas + retardos
export interface AttendanceSummaryItem {
  studentId: string
  sectionId: string
  student: string
  dni: string
  course: string
  totalClasses: number
  presents: number
  absences: number
  justified: number
  lateArrivals: number
  attendancePercentage: number
  weightedAbsences: number
  justifications: Array<{
    id: string
    date: string
    type: 'ausente' | 'media' | 'cuarto'
    reason: string
  }>
  attendanceRecords: Array<{
    id: string
    date: string
    value: Exclude<AttendanceValue, 'PRESENT'>
    justified: boolean
    justification: string | null
  }>
}

export interface AttendanceSummaryResponse {
  items: AttendanceSummaryItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// Todas las funciones usan fetchApi, que agrega el token del usuario logueado
export const attendanceService = {
  // Guarda la asistencia del día de toda la sección (solo el día de hoy, de lunes a viernes)
  saveBatch: (sectionId: string, date: string, records: AttendanceEntry[], signal?: AbortSignal) =>
    fetchApi<{ saved: number }>('/api/attendance/batch', {
      method: 'POST',
      body: JSON.stringify({ sectionId, date, records }),
      signal,
    }),

  // Alumnos de la sección y asistencia registrada en esa fecha
  getBySectionAndDate: (sectionId: string, date: string, signal?: AbortSignal) => {
    const query = new URLSearchParams({ date })
    return fetchApi<SectionAttendanceResponse>(
      `/api/attendance/section/${encodeURIComponent(sectionId)}?${query.toString()}`,
      { signal }
    )
  },

  getSections: (signal?: AbortSignal) =>
    fetchApi<AttendanceSection[]>('/api/class-sections', { signal }),

  // Secciones del ciclo lectivo activo, para la carga diaria y el resumen
  getSummarySections: (signal?: AbortSignal) =>
    fetchApi<AttendanceSection[]>('/api/attendance/sections', { signal }),

  getSummary: (query: URLSearchParams, signal?: AbortSignal) =>
    fetchApi<AttendanceSummaryResponse>(`/api/attendance/summary?${query.toString()}`, {
      signal,
    }),

  // Justificación posterior de una falta (por ejemplo, con certificado médico)
  justify: (attendanceId: string, justification: string, signal?: AbortSignal) =>
    fetchApi<DailyAttendanceRecord>(`/api/attendance/${encodeURIComponent(attendanceId)}/justify`, {
      method: 'PATCH',
      body: JSON.stringify({ justification }),
      signal,
    }),
}
