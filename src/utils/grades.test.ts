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

  it('si finalScore guardado en backend es menor a 7 (ej. MPAA 1 a 3 post-cierre) y no está acreditado, no se muestra como final aprobada', () => {
    const res = calculateSubjectFinalScore({
      finalScore: 3,
      subjectStatus: 'MPAA',
      term1Score: 4,
      term2Score: 5,
    })
    expect(res).toBeUndefined()
  })

  it('si finalScore guardado en backend está acreditado (>= 7), lo utiliza como fallback', () => {
    const res = calculateSubjectFinalScore({
      finalScore: 8,
      subjectStatus: 'APPROVED_ACCREDITED',
    })
    expect(res).toBe(8)
  })

  it('si acreditó en intensificación con nota de 4 a 6 (subjectStatus === APPROVED_ACCREDITED), muestra esa nota final', () => {
    // Caso solicitado en review: AA de 4 a 6 guardada en el backend por intensificación
    const res = calculateSubjectFinalScore({
      finalScore: 5,
      subjectStatus: 'APPROVED_ACCREDITED',
    })
    expect(res).toBe(5)

    const res4 = calculateSubjectFinalScore({
      finalScore: 4,
      subjectStatus: 'APPROVED_ACCREDITED',
    })
    expect(res4).toBe(4)
  })

  it('si no se cargaron notas de cuatrimestre formalmente, no asume nota final aunque haya habido cursada', () => {
    // Paridad con la grilla: sólo se calcula si term1Score y term2Score están formalmente definidos
    const res = calculateSubjectFinalScore({
      term1Score: null,
      term2Score: null,
    })
    expect(res).toBeUndefined()
  })

  it('garantiza paridad total entre la grilla y la vista por alumno', () => {
    // Caso 1: Recuperación de 1.° cuatrimestre aprobada (8) y 2.° cuatrimestre aprobado (7)
    const alumno1Grid = calculateSubjectFinalScore({
      term1Score: 4,
      term2Score: 7,
      term1IntensificationScore: 8,
    })
    const alumno1PorAlumno = calculateSubjectFinalScore({
      term1Score: 4,
      term2Score: 7,
      term1IntensificationScore: 8,
    })
    expect(alumno1Grid).toBe(8)
    expect(alumno1PorAlumno).toBe(alumno1Grid)

    // Caso 2: Acreditación en intensificación (AA) con 6
    const alumno2Grid = calculateSubjectFinalScore({
      term1Score: 4,
      term2Score: 5,
      intensifications: [{ resultCode: 'AA', score: 6 }],
    })
    // En Por Alumno le llega por el backend como APPROVED_ACCREDITED con finalScore = 6
    const alumno2PorAlumno = calculateSubjectFinalScore({
      finalScore: 6,
      subjectStatus: 'APPROVED_ACCREDITED',
      term1Score: 4,
      term2Score: 5,
    })
    expect(alumno2Grid).toBe(6)
    expect(alumno2PorAlumno).toBe(alumno2Grid)
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
