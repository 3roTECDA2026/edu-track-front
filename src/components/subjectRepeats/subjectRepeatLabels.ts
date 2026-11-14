import { SHIFT_LABELS } from '@/components/students/studentLabels'
import { getRole } from '@/services/session'
import type { RepeatOptions, RepeatSection, SubjectRepeat } from '@/services/subjectRepeats.service'

// Quién ve, asigna, edita y quita recursados (igual que SUBJECT_REPEAT_MANAGER_ROLES del back):
// Gestión Escolar, que en el documento de requerimientos incluye a Preceptoría
export const SUBJECT_REPEAT_MANAGER_ROLES = [
  'ADMINISTRATOR',
  'SCHOOL_MANAGEMENT',
  'EOE_DIRECTIVE',
  'PRECEPTOR',
]

export const canManageSubjectRepeats = (): boolean => {
  const role = getRole()
  return !!role && SUBJECT_REPEAT_MANAGER_ROLES.includes(role)
}

// "2° B · Tarde"
export const sectionLabel = (section: RepeatSection) =>
  `${section.grade}° ${section.division} · ${SHIFT_LABELS[section.shift]}`

// "2° B"
export const sectionName = (section: RepeatSection) => `${section.grade}° ${section.division}`

// Origen del recursado (CRM-083): lo creó un PATE al confirmarse o se asignó a mano
export const repeatOrigin = (repeat: SubjectRepeat) => (repeat.pateId ? 'PATE' : 'Manual')

// Llegó al máximo de materias del ciclo (cursadas + recursadas): no se puede asignar otra
export const subjectLimitReached = (options: Pick<RepeatOptions, 'subjectCount' | 'maxSubjects'>) =>
  options.subjectCount >= options.maxSubjects

// "10/12"
export const subjectCountLabel = (options: Pick<RepeatOptions, 'subjectCount' | 'maxSubjects'>) =>
  `${options.subjectCount}/${options.maxSubjects}`
