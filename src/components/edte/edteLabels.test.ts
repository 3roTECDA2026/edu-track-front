import { describe, expect, it } from 'vitest'

import { getSignBlockedReason, isSafeWebUrl } from '@/components/edte/edteLabels'

const TODAY = '2026-03-10'

// Mismas reglas que el back (signEdteMeeting): enlace al acta cargado y reunión ya ocurrida
describe('getSignBlockedReason', () => {
  it('con enlace http(s) válido y la reunión ya ocurrida, se puede firmar', () => {
    expect(
      getSignBlockedReason('https://drive.google.com/acta.pdf', '2026-03-02', TODAY)
    ).toBeNull()
    expect(getSignBlockedReason('http://intranet/acta', '2026-03-02', TODAY)).toBeNull()
  })

  it('una reunión de hoy se puede firmar', () => {
    expect(getSignBlockedReason('https://acta.example.com', TODAY, TODAY)).toBeNull()
  })

  it('sin enlace al acta, no se puede firmar', () => {
    expect(getSignBlockedReason(null, '2026-03-02', TODAY)).toMatch(/enlace válido al acta/)
    expect(getSignBlockedReason(undefined, '2026-03-02', TODAY)).toMatch(/enlace válido al acta/)
    expect(getSignBlockedReason('', '2026-03-02', TODAY)).toMatch(/enlace válido al acta/)
  })

  it('con un enlace que no es una dirección web, no se puede firmar', () => {
    expect(getSignBlockedReason('javascript:alert(1)', '2026-03-02', TODAY)).toMatch(
      /enlace válido/
    )
    expect(getSignBlockedReason('ftp://servidor/acta.pdf', '2026-03-02', TODAY)).toMatch(
      /enlace válido/
    )
    expect(getSignBlockedReason('texto suelto', '2026-03-02', TODAY)).toMatch(/enlace válido/)
  })

  it('con una reunión futura, no se puede firmar aunque tenga acta', () => {
    expect(getSignBlockedReason('https://acta.example.com', '2026-03-11', TODAY)).toMatch(
      /todavía no ocurrió/
    )
  })

  it('el enlace se revisa antes que la fecha', () => {
    expect(getSignBlockedReason(null, '2026-12-10', TODAY)).toMatch(/enlace válido/)
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
