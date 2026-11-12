export type Level = 'low' | 'mid' | 'high' | 'empty'

export function gradeLevel(value: number | undefined): Level {
  if (value === undefined) return 'empty'
  if (value < 4) return 'low'
  if (value <= 6) return 'mid'
  return 'high'
}

export const GRADE_COLORS: Record<Level, { bg: string; fg: string }> = {
  low: { bg: '#fdecec', fg: '#b42318' },
  mid: { bg: '#fdf6e3', fg: '#8a6a00' },
  high: { bg: '#e9f7ee', fg: '#1a7f37' },
  empty: { bg: 'transparent', fg: '#9ca3af' },
}

// Nota con coma decimal, como se escribe en Argentina: 7,5. La nota final puede tener decimales
// porque es el promedio de los dos cuatrimestres (Res. 1650/24, Anexo 5, inc. 8.a)
export function formatScore(value: number): string {
  return value.toLocaleString('es-AR', { maximumFractionDigits: 2 })
}

export const PASSING_SCORE = 7

export interface FinalScoreCalculationInput {
  finalScore?: number | null
  term1Score?: number | null
  term2Score?: number | null
  term1IntensificationScore?: number | null
  intensifications?: Array<{ resultCode: string | null; score: number | null }> | null
}

/**
 * Calcula la nota final de una materia aplicando la regla de aprobación oficial
 * de la grilla y del cierre del ciclo en el backend (CRM-052, CRM-066, CRM-096):
 * 1. Si el backend ya calculó / guardó finalScore, se utiliza directamente.
 * 2. Si acreditó en una intensificación (AA), es la nota de esa intensificación.
 * 3. Si el 2.º cuatrimestre está aprobado (>= 7):
 *    - Si el 1.º cuatrimestre también está aprobado (>= 7): promedio de ambos sin redondear (7 y 8 -> 7,5).
 *    - Si recuperó el 1.º cuatrimestre durante el 2.º (term1IntensificationScore >= 7): la nota de esa recuperación.
 * 4. En cualquier otro caso, la nota final queda sin definir (vacía).
 */
export function calculateSubjectFinalScore(input: FinalScoreCalculationInput | null | undefined): number | undefined {
  if (!input) return undefined
  if (typeof input.finalScore === 'number') return input.finalScore

  const accredited = (input.intensifications ?? []).find((attempt) => attempt.resultCode === 'AA')
  if (accredited && typeof accredited.score === 'number') return accredited.score

  const first = typeof input.term1Score === 'number' ? input.term1Score : undefined
  const second = typeof input.term2Score === 'number' ? input.term2Score : undefined

  if (second === undefined || second < PASSING_SCORE) return undefined
  if (first !== undefined && first >= PASSING_SCORE) return (first + second) / 2

  const recovered = typeof input.term1IntensificationScore === 'number' ? input.term1IntensificationScore : undefined
  if (recovered !== undefined && recovered >= PASSING_SCORE) return recovered

  return undefined
}

export function average(values: Array<number | null | undefined>): number | undefined {
  const nums = values.filter((v): v is number => typeof v === 'number')
  if (nums.length === 0) return undefined
  const sum = nums.reduce((a, b) => a + b, 0)
  return Math.round((sum / nums.length) * 10) / 10
}