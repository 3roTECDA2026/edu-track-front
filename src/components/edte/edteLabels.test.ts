import { describe, expect, it } from 'vitest'

import {
  formatSignedAt,
  getSignBlockedReason,
  isSafeWebUrl,
  memberSignatureLabel,
} from '@/components/edte/edteLabels'

const TODAY = '2026-03-10'

// Misma regla que el back (signEdteMeeting): la reunión tiene que haber ocurrido (CRM-076)
describe('getSignBlockedReason', () => {
  it('una reunión ya ocurrida se puede firmar', () => {
    expect(getSignBlockedReason('2026-03-02', TODAY)).toBeNull()
  })

  it('una reunión de hoy se puede firmar', () => {
    expect(getSignBlockedReason(TODAY, TODAY)).toBeNull()
  })

  it('una reunión futura todavía no se puede firmar', () => {
    expect(getSignBlockedReason('2026-03-11', TODAY)).toMatch(/todavía no ocurrió/)
  })
})

describe('formatSignedAt', () => {
  it('muestra la fecha y la hora en la zona horaria de la escuela', () => {
    expect(formatSignedAt('2026-03-12T17:30:00.000Z')).toBe('12/03/2026 14:30')
  })
})

describe('memberSignatureLabel', () => {
  it('cuándo firmó, firma pendiente o nada si estuvo ausente', () => {
    expect(memberSignatureLabel({ present: true, signedAt: '2026-03-12T17:30:00.000Z' })).toBe(
      'Firmó el 12/03/2026 14:30'
    )
    expect(memberSignatureLabel({ present: true, signedAt: null })).toBe('Pendiente')
    expect(memberSignatureLabel({ present: false, signedAt: null })).toBe('—')
  })
})

describe('isSafeWebUrl', () => {
  it('solo http y https', () => {
    expect(isSafeWebUrl('https://a.com')).toBe(true)
    expect(isSafeWebUrl('http://a.com')).toBe(true)
    expect(isSafeWebUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeWebUrl('data:text/html,x')).toBe(false)
    expect(isSafeWebUrl(null)).toBe(false)
    expect(isSafeWebUrl('')).toBe(false)
  })
})
