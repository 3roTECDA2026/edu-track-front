import { ASSESSMENT_CONFIG } from '@/components/studentProfile/profileLabels'
import type { DashboardTerm, RiskLevel } from '@/services/edteDashboard.service'
import type { PreliminaryAssessment } from '@/services/studentProfile.service'

// Textos y colores del dashboard del EDTE (CRM-077)

// Semáforo de cada alumno. Es la excepción al blanco y negro de la app que pide el ticket: usa la
// misma paleta verde / ámbar / rojo de las valoraciones TEA / TEP / TED (ver docs/standard-mui.md).
export const LEVEL_CONFIG: Record<
  RiskLevel,
  { label: string; color: string; background: string; description: string }
> = {
  HIGH: {
    label: 'Alto',
    ...pick('TED'),
    description: '5 o más materias pendientes, o 2 o más materias con TED',
  },
  MEDIUM: {
    label: 'Medio',
    ...pick('TEP'),
    description: '4 materias pendientes, 1 materia con TED, o valoración TEP',
  },
  LOW: {
    label: 'Bajo',
    ...pick('TEA'),
    description: 'Sin señales de alerta',
  },
}

function pick(value: PreliminaryAssessment) {
  const { color, background } = ASSESSMENT_CONFIG[value]
  return { color, background }
}

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
