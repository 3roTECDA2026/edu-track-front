import type {
  EdteReferral,
  PateStatus,
  PateSummary,
  ReferralSection,
} from '@/services/edteReferrals.service'
import type { Shift } from '@/services/students.service'

// Lógica de la vista de derivados al EDTE (CRM-074), sin React para poder probarla

export interface ReferralRow {
  studentId: string
  firstName: string
  lastName: string
  dni: string
  section: ReferralSection | null
  pendingCountAtDecision: number // MPAA que tenía cuando el motor lo derivó
  pendingCount: number // MPAA que sigue debiendo hoy
  pate: { id: string; status: PateStatus } | null
}

export interface ReferralFilters {
  grade: string // '' = todos
  division: string
  shift: string
  search: string
}

const SHIFT_ORDER: Shift[] = ['MORNING', 'AFTERNOON', 'EVENING', 'EXTRA_TIME']

export const EMPTY_FILTERS: ReferralFilters = { grade: '', division: '', shift: '', search: '' }

const fullName = (row: { lastName: string; firstName: string }) =>
  `${row.lastName} ${row.firstName}`

// Arma una fila por alumno con el estado de su PATE. Si el motor de promoción se corrió más de una
// vez, el mismo alumno puede venir repetido: se queda la decisión más reciente. Ordena primero a
// los que no tienen PATE (criterio 4) y después por apellido.
export function buildReferralRows(referrals: EdteReferral[], pates: PateSummary[]): ReferralRow[] {
  const latest = new Map<string, EdteReferral>()
  for (const referral of referrals) {
    const current = latest.get(referral.student.id)
    if (!current || referral.decidedAt > current.decidedAt)
      latest.set(referral.student.id, referral)
  }

  const pateByStudent = new Map(pates.map((pate) => [pate.student.id, pate]))

  return [...latest.values()]
    .map((referral) => {
      const pate = pateByStudent.get(referral.student.id)
      return {
        studentId: referral.student.id,
        firstName: referral.student.firstName,
        lastName: referral.student.lastName,
        dni: referral.student.dni,
        section: referral.section,
        pendingCountAtDecision: referral.pendingCountAtDecision,
        pendingCount: referral.pendingCount,
        pate: pate ? { id: pate.id, status: pate.status } : null,
      }
    })
    .sort((a, b) => {
      if ((a.pate === null) !== (b.pate === null)) return a.pate === null ? -1 : 1
      return fullName(a).localeCompare(fullName(b), 'es')
    })
}

// Sin mayúsculas ni acentos, para que "perez" encuentre a "Pérez"
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

export function filterReferralRows(rows: ReferralRow[], filters: ReferralFilters): ReferralRow[] {
  const search = normalize(filters.search)
  return rows.filter((row) => {
    if (filters.grade && String(row.section?.grade) !== filters.grade) return false
    if (filters.division && row.section?.division !== filters.division) return false
    if (filters.shift && row.section?.shift !== filters.shift) return false
    if (!search) return true
    const haystack = normalize(`${row.lastName} ${row.firstName} ${row.firstName} ${row.lastName}`)
    return haystack.includes(search) || row.dni.includes(search)
  })
}

// Opciones de los filtros: solo los años, secciones y turnos que aparecen en el listado
export function filterOptions(rows: ReferralRow[]) {
  const sections = rows.flatMap((row) => (row.section ? [row.section] : []))
  return {
    grades: [...new Set(sections.map((section) => section.grade))].sort((a, b) => a - b),
    divisions: [...new Set(sections.map((section) => section.division))].sort((a, b) =>
      a.localeCompare(b, 'es')
    ),
    shifts: SHIFT_ORDER.filter((shift) => sections.some((section) => section.shift === shift)),
  }
}

export const countWithoutPate = (rows: ReferralRow[]) =>
  rows.filter((row) => row.pate === null).length
