import { SHIFT_LABELS } from '@/components/students/studentLabels'
import { getRole } from '@/services/session'
import type { RepeatSection } from '@/services/subjectRepeats.service'

// Quién asigna, edita y quita recursados (igual que SUBJECT_REPEAT_MANAGER_ROLES del back):
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
