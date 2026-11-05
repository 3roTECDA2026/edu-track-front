import { fetchApi } from '@/services/api'

// PRESENT = presente · ABSENT = ausente · QUARTER = retardo de ¼ · HALF = retardo de ½
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
  absences: number // Ausentes sin justificar
  justified: number // Inasistencias y retardos justificados
  lateArrivals: number // Retardos (¼ o ½) sin justificar
  attendancePercentage: number
  weightedAbsences: number // Faltas computables: solo lo no justificado
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
  // Días hábiles del período, si la dirección ya los cargó (null si no)
  schoolDays: number | null
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// Días hábiles del ciclo lectivo (modal de días hábiles)
export interface SchoolDays {
  year: number
  term1SchoolDays: number | null
  term2SchoolDays: number | null
  totalSchoolDays: number | null
}

// Todas las funciones usan fetchApi, que agrega el token del usuario logueado
export const attendanceService = {
  // Guarda la asistencia de un día de toda la sección.
  // Hoy: quien toma asistencia. Un día anterior: solo dirección o administración (lo controla el back).
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

  // Justificación posterior de una inasistencia o un retardo (por ejemplo, con certificado médico)
  justify: (attendanceId: string, justification: string, signal?: AbortSignal) =>
    fetchApi<DailyAttendanceRecord>(`/api/attendance/${encodeURIComponent(attendanceId)}/justify`, {
      method: 'PATCH',
      body: JSON.stringify({ justification }),
      signal,
    }),

  // Días hábiles del ciclo (total y por cuatrimestre)
  getSchoolDays: (year: number, signal?: AbortSignal) =>
    fetchApi<SchoolDays>(`/api/attendance/school-days?year=${year}`, { signal }),

  saveSchoolDays: (data: SchoolDays) =>
    fetchApi<SchoolDays>('/api/attendance/school-days', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}
