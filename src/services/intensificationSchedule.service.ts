import { fetchApi } from '@/services/api'

export type IntensificationPeriod = 'DECEMBER' | 'FEBRUARY_MARCH' | 'AUGUST'

export interface ScheduleTeacher {
  id: string
  name: string
}

// Materia que se intensifica en un período, con su docente responsable
export interface ScheduleSubject {
  id: string
  subjectId: string
  subjectName: string
  gradeLevel: number
  teacher: ScheduleTeacher | null
}

// Período de intensificación de un ciclo lectivo (E3-RF-04)
export interface IntensificationSchedule {
  id: string
  year: number
  period: IntensificationPeriod
  startDate: string
  endDate: string
  assignedStudents: number
  subjects: ScheduleSubject[]
}

const BASE = '/api/intensification-schedules'

export const intensificationScheduleService = {
  list: (year: number, signal?: AbortSignal) =>
    fetchApi<IntensificationSchedule[]>(`${BASE}?year=${year}`, { signal }),

  create: (data: {
    year: number
    period: IntensificationPeriod
    startDate: string
    endDate: string
  }) => fetchApi<IntensificationSchedule>(BASE, { method: 'POST', body: JSON.stringify(data) }),

  updateDates: (id: string, data: { startDate: string; endDate: string }) =>
    fetchApi<IntensificationSchedule>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (id: string) => fetchApi<{ deleted: boolean }>(`${BASE}/${id}`, { method: 'DELETE' }),

  addSubject: (id: string, data: { subjectId: string; teacherId: string | null }) =>
    fetchApi<IntensificationSchedule>(`${BASE}/${id}/subjects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSubjectTeacher: (id: string, entryId: string, teacherId: string | null) =>
    fetchApi<IntensificationSchedule>(`${BASE}/${id}/subjects/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ teacherId }),
    }),

  removeSubject: (id: string, entryId: string) =>
    fetchApi<IntensificationSchedule>(`${BASE}/${id}/subjects/${entryId}`, { method: 'DELETE' }),

  // Docentes activos (solo para dirección y administración)
  listTeachers: (signal?: AbortSignal) =>
    fetchApi<ScheduleTeacher[]>(`${BASE}/teachers`, { signal }),
}
