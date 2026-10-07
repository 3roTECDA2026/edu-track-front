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


export function average(values: Array<number | null | undefined>): number | undefined {
  const nums = values.filter((v): v is number => typeof v === 'number')
  if (nums.length === 0) return undefined
  const sum = nums.reduce((a, b) => a + b, 0)
  return Math.round((sum / nums.length) * 10) / 10
}