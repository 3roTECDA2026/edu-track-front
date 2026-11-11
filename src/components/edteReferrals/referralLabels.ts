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

// Estado del PATE de cada alumno. Sin colores nuevos (la app es blanco y negro): "Sin PATE" se
// destaca con borde y texto oscuros, ícono de aviso y la fila sombreada (criterio 4).
export const PATE_STATE_CONFIG: Record<
  PateState,
  { label: string; icon: SvgIconComponent; highlighted: boolean }
> = {
  NONE: { label: 'Sin PATE', icon: ReportProblemOutlined, highlighted: true },
  DRAFT: { label: 'Borrador', icon: EditNoteOutlined, highlighted: false },
  IN_PROGRESS: { label: 'En curso', icon: CheckCircleOutlined, highlighted: false },
  CLOSED: { label: 'Cerrado', icon: TaskAltOutlined, highlighted: false },
}

// Pantalla del PATE en el front: todavía no existe (ver CRM-074-plan, 3.2.3). Mientras sea null,
// el botón "Crear PATE" queda deshabilitado con una explicación.
export const CREATE_PATE_PATH: ((studentId: string) => string) | null = null

export const CREATE_PATE_UNAVAILABLE = 'La pantalla para crear el PATE todavía no está disponible'
