import type { IntensificationModel } from '@/services/pate.service'

export const MODEL_LABELS: Record<IntensificationModel, string> = {
  MODEL_1: 'Modelo 1: En la misma sección (sin cambio de turno)',
  MODEL_2: 'Modelo 2: En otra sección del mismo turno',
  MODEL_3: 'Modelo 3: En sección a contraturno',
  MODEL_4: 'Modelo 4: Proyecto específico / tutoría',
}

export const MODEL_SHORT_LABELS: Record<IntensificationModel, string> = {
  MODEL_1: 'Modelo 1',
  MODEL_2: 'Modelo 2',
  MODEL_3: 'Modelo 3',
  MODEL_4: 'Modelo 4',
}

export const MAX_SUBJECTS_TO_INTENSIFY = 4
export const MAX_SUBJECTS_TOTAL = 12

// Roles con permiso para gestionar y crear PATE (mismos que en el backend)
export const PATE_MANAGER_ROLES = ['ADMINISTRATOR', 'SCHOOL_MANAGEMENT', 'EOE_DIRECTIVE']
export const PATE_VIEWER_ROLES = [...PATE_MANAGER_ROLES, 'TEACHER', 'PRECEPTOR']

export function isSectionRequiredForModel(model: IntensificationModel): boolean {
  return model === 'MODEL_2' || model === 'MODEL_3'
}

export const EVALUATION_LABELS: Record<'FAVORABLE' | 'PARTIAL' | 'UNFAVORABLE', string> = {
  FAVORABLE: 'Favorable',
  PARTIAL: 'Parcial',
  UNFAVORABLE: 'Desfavorable',
}
