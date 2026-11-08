import type { FortePlanStatus } from '@/services/fortePlan.service'

// Estado del alumno en el Plan Forte, con los colores de las etiquetas de la ficha
export const FORTE_STATUS_CONFIG: Record<
  FortePlanStatus,
  { label: string; color: string; background: string }
> = {
  ACTIVE: { label: 'Activo', color: '#15803d', background: '#dcfce7' },
  COMPLETED: { label: 'Finalizado', color: '#1e40af', background: '#dbeafe' },
  WITHDRAWN: { label: 'Dado de baja', color: '#6b7280', background: '#f3f4f6' },
}
