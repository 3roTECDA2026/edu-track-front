import type {
  IntensificationModel,
  PatePendingSubjectOption,
  PateSectionOption,
} from '@/services/pate.service'
import { isSectionRequiredForModel, MAX_SUBJECTS_TO_INTENSIFY } from '@/components/pate/pateLabels'

export interface SelectedIntensifyItem {
  pendingSubjectId: string
  model: IntensificationModel
  targetClassSectionId: string
}

export interface SelectedRepeatItem {
  pendingSubjectId: string
  classSectionId: string
}

export interface PateFormState {
  edteMeetingId: string
  diagnosis: string
  supportStrategies: string
  schedule: string
  intensifyMap: Map<string, SelectedIntensifyItem>
  repeatMap: Map<string, SelectedRepeatItem>
}

export interface ClientValidationResult {
  valid: boolean
  errors: string[]
}

export function validatePateClientState(
  state: PateFormState,
  options: {
    currentSubjectsCount: number
    maxSubjectsPerCycle: number
    pendingSubjects: PatePendingSubjectOption[]
    sections: PateSectionOption[]
  }
): ClientValidationResult {
  const errors: string[] = []

  if (!state.edteMeetingId.trim()) {
    errors.push('Elegí la reunión del EDTE donde se trató al alumno')
  }

  if (!state.diagnosis.trim()) {
    errors.push('Completá el diagnóstico de situación')
  }

  if (!state.supportStrategies.trim()) {
    errors.push('Completá las estrategias de acompañamiento')
  }

  const intensifyCount = state.intensifyMap.size
  if (intensifyCount > MAX_SUBJECTS_TO_INTENSIFY) {
    errors.push(
      `Se pueden intensificar hasta ${MAX_SUBJECTS_TO_INTENSIFY} materias (elegiste ${intensifyCount})`
    )
  }

  // Verificar que modelos 2 y 3 tengan sección asignada
  for (const item of state.intensifyMap.values()) {
    if (isSectionRequiredForModel(item.model) && !item.targetClassSectionId) {
      const subject = options.pendingSubjects.find(
        (s) => s.pendingSubjectId === item.pendingSubjectId
      )
      const name = subject?.subjectName ?? 'Materia'
      errors.push(`${name}: los modelos 2 y 3 requieren elegir año/sección/turno`)
    }
  }

  // Verificar que todas las materias a recursar tengan sección
  for (const item of state.repeatMap.values()) {
    if (!item.classSectionId) {
      const subject = options.pendingSubjects.find(
        (s) => s.pendingSubjectId === item.pendingSubjectId
      )
      const name = subject?.subjectName ?? 'Materia'
      errors.push(`${name}: requiere elegir año/sección/turno para recursar`)
    }
  }

  // Verificar límite total de 12 materias
  const repeatCount = state.repeatMap.size
  const totalSubjects = options.currentSubjectsCount + repeatCount
  if (totalSubjects > options.maxSubjectsPerCycle) {
    errors.push(
      `El alumno tiene ${options.currentSubjectsCount} materias en el ciclo; con ${repeatCount} a recursar serían ${totalSubjects} y el máximo es ${options.maxSubjectsPerCycle}`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
