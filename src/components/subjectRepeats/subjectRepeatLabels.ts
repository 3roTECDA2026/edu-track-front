import { SHIFT_LABELS } from '@/components/students/studentLabels'
import { getRole } from '@/services/session'
import type { RepeatSection } from '@/services/subjectRepeats.service'

// Quién asigna, edita y quita recursados (igual que SUBJECT_REPEAT_MANAGER_ROLES del back).
// PENDIENTE: definir si PRECEPTOR también asigna ("Gestión Escolar" incluye a Preceptoría en el
// documento de requerimientos). Hasta entonces solo ve.
export const SUBJECT_REPEAT_MANAGER_ROLES = ['ADMINISTRATOR', 'SCHOOL_MANAGEMENT', 'EOE_DIRECTIVE']

export const canManageSubjectRepeats = (): boolean => {
  const role = getRole()
  return !!role && SUBJECT_REPEAT_MANAGER_ROLES.includes(role)
}

// "2° B · Tarde"
export const sectionLabel = (section: RepeatSection) =>
  `${section.grade}° ${section.division} · ${SHIFT_LABELS[section.shift]}`
