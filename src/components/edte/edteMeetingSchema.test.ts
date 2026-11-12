import { describe, expect, it } from 'vitest'

import {
  edteMeetingFormSchema,
  meetingDateError,
  meetingDateHint,
} from '@/components/edte/edteMeetingSchema'

const valid = {
  year: 2026,
  date: '2026-03-02',
  period: 'FEBRUARY_MARCH' as const,
  shift: '' as const,
  considerations: '',
  minutesUrl: '',
}

// Mismas reglas que el back (assertMeetingDate): año del ciclo y, solo en febrero/marzo, esos meses
describe('fecha de la reunión según el período', () => {
  describe('febrero/marzo', () => {
    it.each(['2026-02-01', '2026-02-28', '2026-03-01', '2026-03-31'])('%s sirve', (date) => {
      expect(meetingDateError(date, 'FEBRUARY_MARCH', 2026)).toBeNull()
    })

    it.each(['2026-01-31', '2026-04-01', '2026-08-20', '2026-12-10'])('%s no sirve', (date) => {
      expect(meetingDateError(date, 'FEBRUARY_MARCH', 2026)).toMatch(/febrero o marzo/)
    })
  })

  describe('agosto, diciembre y adicional: cualquier fecha del año del ciclo', () => {
    it.each(['AUGUST', 'DECEMBER', 'ADDITIONAL'] as const)('%s acepta cualquier mes', (period) => {
      for (const date of ['2026-01-15', '2026-03-02', '2026-08-20', '2026-12-10']) {
        expect(meetingDateError(date, period, 2026)).toBeNull()
      }
    })
  })

  describe('el año tiene que ser el del ciclo, en todos los períodos', () => {
    it.each(['FEBRUARY_MARCH', 'AUGUST', 'DECEMBER', 'ADDITIONAL'] as const)('%s', (period) => {
      expect(meetingDateError('2025-03-02', period, 2026)).toBe(
        'La fecha tiene que ser del año 2026'
      )
      expect(meetingDateError('2027-03-02', period, 2026)).toBe(
        'La fecha tiene que ser del año 2026'
      )
    })
  })

  it('sin fecha, no informa nada acá (lo informa el campo obligatorio)', () => {
    expect(meetingDateError('', 'FEBRUARY_MARCH', 2026)).toBeNull()
  })

  it('cada período tiene su ayuda con el año del ciclo', () => {
    expect(meetingDateHint('FEBRUARY_MARCH', 2026)).toMatch(/1 de febrero y el 31 de marzo de 2026/)
    expect(meetingDateHint('AUGUST', 2026)).toMatch(/2026/)
    expect(meetingDateHint('DECEMBER', 2026)).toMatch(/2026/)
    expect(meetingDateHint('ADDITIONAL', 2026)).toMatch(/2026/)
  })
})

describe('formulario de reunión del EDTE', () => {
  it('acepta una reunión válida', () => {
    expect(edteMeetingFormSchema.safeParse(valid).success).toBe(true)
  })

  it('rechaza la fecha de otro período y la informa en el campo de la fecha', () => {
    const result = edteMeetingFormSchema.safeParse({ ...valid, date: '2026-08-20' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['date'])
  })

  it('exige la fecha', () => {
    const result = edteMeetingFormSchema.safeParse({ ...valid, date: '' })
    expect(result.success).toBe(false)
  })

  it('rechaza el período inválido', () => {
    expect(edteMeetingFormSchema.safeParse({ ...valid, period: 'JULY' }).success).toBe(false)
  })

  describe('enlace al acta', () => {
    it.each(['', 'https://drive.google.com/acta.pdf', 'http://intranet.escuela/acta'])(
      '%s se acepta',
      (minutesUrl) => {
        expect(edteMeetingFormSchema.safeParse({ ...valid, minutesUrl }).success).toBe(true)
      }
    )

    it.each([
      'javascript:alert(1)',
      'data:text/html,x',
      'ftp://servidor/acta.pdf',
      'no es un enlace',
    ])('%s se rechaza', (minutesUrl) => {
      const result = edteMeetingFormSchema.safeParse({ ...valid, minutesUrl })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.issues[0]?.path).toEqual(['minutesUrl'])
    })
  })
})
