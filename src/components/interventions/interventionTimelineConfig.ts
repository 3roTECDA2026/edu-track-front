import type { SvgIconComponent } from '@mui/icons-material'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'

import type { InterventionEventType } from '@/services/interventions.service'

// Cómo se muestra cada tipo de evento en la línea de tiempo (CRM-088).
// La app es blanco y negro (CLAUDE.md, "Estilos y colores"): cada tipo se distingue por su
// ícono, su texto y un tono de gris propio, nunca solo por el color.
export const EVENT_TYPE_CONFIG: Record<
  InterventionEventType,
  { label: string; Icon: SvgIconComponent; color: string; background: string }
> = {
  // Tres tonos de la paleta del estándar: negro, gris medio y gris claro
  PEDAGOGICAL: {
    label: 'Pedagógico',
    Icon: SchoolOutlinedIcon,
    color: '#ffffff',
    background: '#111827',
  },
  CONDUCT: {
    label: 'Conductual',
    Icon: ForumOutlinedIcon,
    color: '#ffffff',
    background: '#6b7280',
  },
  HEALTH: {
    label: 'Salud',
    Icon: LocalHospitalOutlinedIcon,
    color: '#111827',
    background: '#f3f4f6',
  },
}

export const EVENT_TYPES = Object.keys(EVENT_TYPE_CONFIG) as InterventionEventType[]

// Igual que en el back: el autor puede sumar adjuntos durante 48 hs desde que la registró.
export const ATTACHMENT_WINDOW_HOURS = 48

// ¿Puede este usuario sumar adjuntos a la intervención? (CRM-087/088)
export function canAddAttachments(
  intervention: { authorId: string; createdAt: string },
  userId: string | undefined,
  now: number = Date.now()
): boolean {
  if (!userId || intervention.authorId !== userId) return false
  const hours = (now - new Date(intervention.createdAt).getTime()) / (1000 * 60 * 60)
  return hours <= ATTACHMENT_WINDOW_HOURS
}

// Mensaje si el rango de fechas no tiene sentido; null si está bien.
export function validateDateRange(from?: string, to?: string): string | null {
  if (from && to && from > to) return 'La fecha "desde" no puede ser posterior a "hasta".'
  return null
}

// Resumen corto de un texto largo, sin cortar palabras a la mitad.
export function summarize(text: string, maxLength = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLength) return clean
  const cut = clean.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}
