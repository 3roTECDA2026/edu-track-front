import { describe, expect, it } from 'vitest'
import { average, calculateSubjectFinalScore, formatScore } from './grades'

describe('calculateSubjectFinalScore (CRM-096, CRM-052, CRM-066)', () => {
  it('devuelve undefined si input es nulo o indefinido', () => {
    expect(calculateSubjectFinalScore(null)).toBeUndefined()
    expect(calculateSubjectFinalScore(undefined)).toBeUndefined()
  })

  it('asigna la nota de intensificación cuando acreditó con AA', () => {
    const res = calculateSubjectFinalScore({
      term1Score: 4,
      term2Score: 5,
      intensifications: [
        { resultCode: 'CCA', score: 3 },
        { resultCode: 'AA', score: 6 },
      ],
    })
    expect(res).toBe(6)
  })

  it('calcula promedio exacto sin redondear si ambos cuatrimestres tienen 7 o más', () => {
    // 7 y 8 -> 7.5 (que en UI se formatea "7,5")
    const res1 = calculateSubjectFinalScore({
      term1Score: 7,
      term2Score: 8,
    })
    expect(res1).toBe(7.5)

    // 7 y 7 -> 7
    const res2 = calculateSubjectFinalScore({
      term1Score: 7,
      term2Score: 7,
    })
    expect(res2).toBe(7)

    // 9 y 10 -> 9.5
    const res3 = calculateSubjectFinalScore({
      term1Score: 9,
      term2Score: 10,
    })
    expect(res3).toBe(9.5)
  })

  it('devuelve undefined si el segundo cuatrimestre es menor a 7 (PASSING_SCORE)', () => {
    const res = calculateSubjectFinalScore({
      term1Score: 9,
      term2Score: 6.5,
    })
    expect(res).toBeUndefined()
  })

  it('con 1.º cuatrimestre reprobado pero recuperado durante el 2.º (>= 7), la nota final es la de recuperación', () => {
    const res = calculateSubjectFinalScore({
      term1Score: 4,
      term2Score: 8,
      term1IntensificationScore: 7,
    })
    expect(res).toBe(7)
  })

  it('con recuperación del 1.º cuatrimestre desaprobada (< 7), la materia no aprueba (undefined)', () => {
    const res = calculateSubjectFinalScore({
      term1Score: 4,
      term2Score: 8,
      term1IntensificationScore: 6,
    })
    expect(res).toBeUndefined()
  })

  it('con recuperación aprobada pero 2.º cuatrimestre desaprobado, la materia no aprueba (undefined)', () => {
    const res = calculateSubjectFinalScore({
      term1Score: 4,
      term2Score: 5,
      term1IntensificationScore: 8,
    })
    expect(res).toBeUndefined()
  })

  it('si finalScore guardado en backend es menor a 7 (ej. MPAA 1 a 3 post-cierre), no se muestra como final aprobada', () => {
    const res = calculateSubjectFinalScore({
      finalScore: 3,
      term1Score: 4,
      term2Score: 5,
    })
    expect(res).toBeUndefined()
  })

  it('si finalScore guardado en backend está acreditado (>= 7), lo utiliza si no hay cuatrimestres en vivo', () => {
    const res = calculateSubjectFinalScore({
      finalScore: 8,
    })
    expect(res).toBe(8)
  })
})

describe('formatScore', () => {
  it('formatea notas con coma decimal argentina', () => {
    expect(formatScore(7.5)).toBe('7,5')
    expect(formatScore(9.5)).toBe('9,5')
    expect(formatScore(8)).toBe('8')
  })
})

describe('average', () => {
  it('redondea a un decimal para promedios de cuatrimestre o generales', () => {
    expect(average([7, 8])).toBe(7.5)
    expect(average([7.5, 8.5])).toBe(8)
    expect(average([])).toBeUndefined()
  })
})
