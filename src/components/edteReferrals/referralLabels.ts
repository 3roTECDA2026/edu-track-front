import type { SvgIconComponent } from '@mui/icons-material'
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined'
import EditNoteOutlined from '@mui/icons-material/EditNoteOutlined'
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined'
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined'

import type { PateStatus } from '@/services/edteReferrals.service'

// Textos de la vista de derivados al EDTE (CRM-074)

// Quién ve la pantalla: igual que el dashboard del EDTE (CRM-077). Administración no.
// Los integrantes del plantel del EDTE se suman cuando exista GET /api/edte-members/me (#58).
export const EDTE_REFERRALS_ROLES = ['EOE_DIRECTIVE', 'SCHOOL_MANAGEMENT']

export type PateState = PateStatus | 'NONE'

// Cuánto se destaca cada estado. Sin colores nuevos (la app es blanco y negro), se distinguen por
// el borde, el peso del texto y el ícono:
// - alert: "Sin PATE", lo que hay que atender (borde continuo oscuro, negrita y fila sombreada;
//   criterio 4);
// - inProgress: "Borrador", hay una propuesta empezada sin presentar (borde punteado oscuro);
// - none: el resto (gris).
export type PateEmphasis = 'alert' | 'inProgress' | 'none'

// Estado del PATE de cada alumno. "Borrador" es un estado propio, distinto de "Sin PATE"
// (decisión del equipo: uno es que todavía no existe; el otro, que ya hay algo en proceso)
export const PATE_STATE_CONFIG: Record<
  PateState,
  { label: string; icon: SvgIconComponent; emphasis: PateEmphasis }
> = {
  NONE: { label: 'Sin PATE', icon: ReportProblemOutlined, emphasis: 'alert' },
  DRAFT: { label: 'Borrador', icon: EditNoteOutlined, emphasis: 'inProgress' },
  IN_PROGRESS: { label: 'En curso', icon: CheckCircleOutlined, emphasis: 'none' },
  CLOSED: { label: 'Cerrado', icon: TaskAltOutlined, emphasis: 'none' },
}

// Pantalla del PATE en el front: todavía no existe. La ruta acordada es /pates/new?studentId=
// (ver CRM-074-plan, 3.2.3); el ticket del formulario está por confirmar. Mientras sea null, el
// botón "Crear PATE" queda deshabilitado con una explicación.
export const CREATE_PATE_PATH: ((studentId: string) => string) | null = null

export const CREATE_PATE_UNAVAILABLE = 'La pantalla para crear el PATE todavía no está disponible'
