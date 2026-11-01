import type { IntensificationModel, ResultCode } from '@/services/intensification.service'
import type { IntensificationPeriod } from '@/services/intensificationSchedule.service'
import { SHIFT_LABELS } from '@/components/students/studentLabels'

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

// Resultados de la intensificación (E3-RF-08)
export const RESULT_LABELS: Record<ResultCode, string> = {
  AA: 'AA · Acreditó y aprobó',
  CCA: 'CCA · Continúa con actividades de intensificación',
  CSA: 'CSA · Sin actividades, no intensificó',
}

// Año, sección y turno de una sección, por ejemplo "2° B · Tarde"
export const sectionLabel = (section: { grade: number; division: string; shift: string }) =>
  `${section.grade}° ${section.division} · ${SHIFT_LABELS[section.shift as keyof typeof SHIFT_LABELS] ?? section.shift}`
