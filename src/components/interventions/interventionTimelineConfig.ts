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
// Tolerancia para la diferencia de hora entre la PC y el servidor.
const CLOCK_TOLERANCE_HOURS = 1

// ¿Puede este usuario sumar adjuntos a la intervención? (CRM-087/088)
export function canAddAttachments(
  intervention: { authorId: string; createdAt: string },
  userId: string | undefined,
  now: number = Date.now()
): boolean {
  if (!userId || intervention.authorId !== userId) return false
  const createdAt = new Date(intervention.createdAt).getTime()
  // Fecha que no se puede leer: no se ofrece (el back igual lo valida)
  if (Number.isNaN(createdAt)) return false
  const hours = (now - createdAt) / (1000 * 60 * 60)
  // Un poco en el futuro puede ser el reloj de la PC atrasado; mucho más es un dato inválido
  if (hours < -CLOCK_TOLERANCE_HOURS) return false
  return hours <= ATTACHMENT_WINDOW_HOURS
}

// Nombre del PDF exportado: "intervenciones-Perez-2026-11-18.pdf". Así no quedan todos con el
// mismo nombre al exportar los de varios alumnos. Se sacan los caracteres que Windows no acepta.
export function timelinePdfFileName(studentLastName: string | undefined, today: string): string {
  const name = (studentLastName ?? '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .trim()
  return name ? `intervenciones-${name}-${today}.pdf` : `intervenciones-${today}.pdf`
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
