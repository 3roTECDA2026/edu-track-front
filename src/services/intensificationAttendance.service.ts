import { fetchApi } from '@/services/api'
import type {
  IntensificationModel,
  IntensificationStudent,
  SectionRef,
} from '@/services/intensification.service'
import type { IntensificationPeriod } from '@/services/intensificationSchedule.service'

// Asistencia en intensificación (CRM-059).
// Los textos de los valores están en components/intensification/intensificationLabels.ts

export type IntensificationAttendanceValue = 'PRESENT' | 'ABSENT' | 'EXCUSED'

// Alumno que intensifica en otra sección (modelos 2 y 3), con lo cargado en la fecha
export interface IntensificationAttendanceStudent {
  intensificationId: string
  student: IntensificationStudent
  model: IntensificationModel
  targetClassSection: SectionRef | null
  responsibleTeacherId: string | null
  value: IntensificationAttendanceValue | null
}

export interface IntensificationAttendanceDay {
  schedule: { id: string; period: IntensificationPeriod; startDate: string; endDate: string }
  date: string
  students: IntensificationAttendanceStudent[]
}

export interface SaveIntensificationAttendanceInput {
  scheduleId: string
  subjectId: string
  date: string
  records: { intensificationId: string; value: IntensificationAttendanceValue }[]
}

const BASE = '/api/intensification-attendance'

export const intensificationAttendanceService = {
  // Alumnos del período y la materia, con la asistencia de esa fecha
  get: (
    params: { scheduleId: string; subjectId: string; date: string },
    signal?: AbortSignal
  ) => {
    const query = new URLSearchParams({
      scheduleId: params.scheduleId,
      subjectId: params.subjectId,
      date: params.date,
    })
    return fetchApi<IntensificationAttendanceDay>(`${BASE}?${query.toString()}`, { signal })
  },

  // Guarda la asistencia del día: volver a guardar actualiza lo cargado
  save: (data: SaveIntensificationAttendanceInput) =>
    fetchApi<{ saved: number }>(`${BASE}/batch`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
