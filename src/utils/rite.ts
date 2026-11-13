import type { RiteIntensificationCell } from '@/services/rite.service'
import { formatScore } from '@/utils/grades'

// Texto de una celda de intensificación del RITE (Res. 1650/24, Anexo 5): con AA va la nota y
// con CCA o CSA, el código. Los RITE firmados antes de CRM-044 guardaron solo la nota.
export function intensificationText(cell: RiteIntensificationCell | undefined): string {
  if (cell === null || cell === undefined) return ''
  if (typeof cell === 'number') return formatScore(cell)
  if (cell.resultCode === 'AA' && cell.score !== null) return formatScore(cell.score)
  return cell.resultCode ?? ''
}
