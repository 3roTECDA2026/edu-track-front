import { ASSESSMENT_CONFIG } from '@/components/studentProfile/profileLabels'
import type {
  DashboardTerm,
  DashboardThresholds,
  RiskLevel,
} from '@/services/edteDashboard.service'
import type { PreliminaryAssessment } from '@/services/studentProfile.service'

// Textos y colores del dashboard del EDTE (CRM-077)

// Semáforo de cada alumno. Es la excepción al blanco y negro de la app que pide el ticket: usa la
// misma paleta verde / ámbar / rojo de las valoraciones TEA / TEP / TED (ver docs/standard-mui.md).
// Cada nivel lleva además un texto ("Riesgo alto") y un ícono, para que no dependa solo del color.
export const LEVEL_CONFIG: Record<
  RiskLevel,
  { label: string; text: string; color: string; background: string }
> = {
  HIGH: { label: 'Alto', text: 'Riesgo alto', ...pick('TED') },
  MEDIUM: { label: 'Medio', text: 'Riesgo medio', ...pick('TEP') },
  LOW: { label: 'Bajo', text: 'Riesgo bajo', ...pick('TEA') },
}

function pick(value: PreliminaryAssessment) {
  const { color, background } = ASSESSMENT_CONFIG[value]
  return { color, background }
}

const subjects = (count: number) => (count === 1 ? '1 materia' : `${count} materias`)

// Qué significa cada nivel, con los umbrales que informa el back (así el texto no repite los
// números y siempre coincide con la regla que se aplica)
export function levelDescription(level: RiskLevel, thresholds: DashboardThresholds): string {
  const { earlyWarningPending, referredPending, mediumTedCount, highTedCount } = thresholds
  if (level === 'HIGH') {
    return `${referredPending} o más materias pendientes, o ${highTedCount} o más materias con TED`
  }
  if (level === 'MEDIUM') {
    return `${subjects(earlyWarningPending)} pendientes, ${subjects(mediumTedCount)} con TED, o valoración TEP`
  }
  return 'Sin señales de alerta'
}

// Aclaraciones de las tarjetas de riesgo, también con los umbrales del back
export const referredHint = (t: DashboardThresholds) =>
  `${t.referredPending} o más materias pendientes`
export const earlyWarningHint = (t: DashboardThresholds) =>
  `${subjects(t.earlyWarningPending)} pendientes`

// Valoración "sin cargar": gris, igual que el resto de las celdas vacías de la ficha
export const NO_ASSESSMENT = { label: 'Sin valoración', color: '#6b7280', background: '#f3f4f6' }

export const DASHBOARD_TERM_LABELS: Record<DashboardTerm, string> = {
  FIRST: '1° cuatrimestre',
  SECOND: '2° cuatrimestre',
}

// Quienes ven el dashboard: EOE y dirección (como el back). Cuando esté CRM-071 (plantel del
// EDTE), también los integrantes del equipo.
export const EDTE_DASHBOARD_ROLES = ['EOE_DIRECTIVE', 'SCHOOL_MANAGEMENT']

export const GRADE_FILTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7]

// Estado del PATE en el listado. Incluye los valores de hoy y los que suma CRM-078.
// CRM-075 tiene el mismo texto en `edte/edteLabels.ts` (pateStatusLabel): cuando esté en develop,
// se usa ese y se borra este.
const PATE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'En curso',
  UNDER_FOLLOW_UP: 'En curso',
  FINISHED: 'Cerrado',
  DRAFT: 'Borrador',
  IN_PROGRESS: 'En curso',
  CLOSED: 'Cerrado',
}

export const pateStatusLabel = (status: string) => PATE_STATUS_LABELS[status] ?? status
