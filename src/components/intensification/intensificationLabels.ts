import type { IntensificationModel, ResultCode } from '@/services/intensification.service'
import type { IntensificationAttendanceValue } from '@/services/intensificationAttendance.service'
import type { IntensificationPeriod } from '@/services/intensificationSchedule.service'
import { SHIFT_LABELS } from '@/components/students/studentLabels'
import type { OrganizationalModel } from '@/services/institutionalConfig.service'

// Traducción de los enums de intensificación a los textos que ve el usuario

export const PERIOD_LABELS: Record<IntensificationPeriod, string> = {
  AUGUST: 'Agosto',
  DECEMBER: 'Diciembre',
  FEBRUARY_MARCH: 'Febrero / Marzo',
}

// Texto largo: para elegir el modelo en el formulario (E3-RF-06)
export const MODEL_LABELS: Record<IntensificationModel, string> = {
  MODEL_1: 'Modelo 1 · Materia del año siguiente',
  MODEL_2: 'Modelo 2 · Misma materia, mismo turno',
  MODEL_3: 'Modelo 3 · Misma materia, contraturno',
  MODEL_4: 'Modelo 4 · Espacio específico',
}

// Texto corto: para la columna de la tabla
export const MODEL_SHORT_LABELS: Record<IntensificationModel, string> = {
  MODEL_1: 'Modelo 1',
  MODEL_2: 'Modelo 2',
  MODEL_3: 'Modelo 3',
  MODEL_4: 'Modelo 4',
}

// Resultados de la intensificación (E3-RF-08), con los nombres del documento de requerimientos
export const RESULT_LABELS: Record<ResultCode, string> = {
  AA: 'AA · Acreditó y aprobó',
  CCA: 'CCA · Continúa con avances',
  CSA: 'CSA · Continúa sin avances',
}

// Asistencia en intensificación (CRM-059): la letra del botón y el texto completo
export const ATTENDANCE_SHORT_LABELS: Record<IntensificationAttendanceValue, string> = {
  PRESENT: 'P',
  ABSENT: 'A',
  EXCUSED: 'J',
}

export const ATTENDANCE_LABELS: Record<IntensificationAttendanceValue, string> = {
  PRESENT: 'Presente',
  ABSENT: 'Ausente',
  EXCUSED: 'Ausente con justificación',
}

// Año, sección y turno de una sección, por ejemplo "2° B · Tarde"
export const sectionLabel = (section: { grade: number; division: string; shift: string }) =>
  `${section.grade}° ${section.division} · ${SHIFT_LABELS[section.shift as keyof typeof SHIFT_LABELS] ?? section.shift}`

// Opción organizativa de la escuela (CRM-065), con la letra que ve el usuario
export const OPTION_LABELS: Record<OrganizationalModel, string> = {
  OPTION_A: 'A',
  OPTION_B: 'B',
  OPTION_C: 'C',
  OPTION_D: 'D',
}

// Modelos de intensificación de cada opción organizativa (Cuadro 2 del Anexo 5, Res. 1650/24).
// El back aplica la misma tabla al validar: esta es solo para mostrar las opciones.
export const MODELS_BY_OPTION: Record<OrganizationalModel, IntensificationModel[]> = {
  OPTION_A: ['MODEL_1', 'MODEL_2'],
  OPTION_B: ['MODEL_1', 'MODEL_3'],
  OPTION_C: ['MODEL_1', 'MODEL_2', 'MODEL_3'],
  OPTION_D: ['MODEL_1', 'MODEL_4'],
}
