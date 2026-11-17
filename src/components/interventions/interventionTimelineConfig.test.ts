import { describe, expect, it } from 'vitest'

import {
  canAddAttachments,
  summarize,
  validateDateRange,
} from '@/components/interventions/interventionTimelineConfig'
import { buildInterventionParams } from '@/services/interventions.service'

describe('canAddAttachments', () => {
  const createdAt = '2026-11-13T12:00:00.000Z'
  const hoursLater = (hours: number) => new Date(createdAt).getTime() + hours * 60 * 60 * 1000

  it('el autor puede durante las primeras 48 hs', () => {
    expect(canAddAttachments({ authorId: 'u1', createdAt }, 'u1', hoursLater(1))).toBe(true)
    expect(canAddAttachments({ authorId: 'u1', createdAt }, 'u1', hoursLater(48))).toBe(true)
  })

  it('después de 48 hs ya no', () => {
    expect(canAddAttachments({ authorId: 'u1', createdAt }, 'u1', hoursLater(49))).toBe(false)
  })

  it('otro usuario, o sin sesión, no puede', () => {
    expect(canAddAttachments({ authorId: 'u1', createdAt }, 'u2', hoursLater(1))).toBe(false)
    expect(canAddAttachments({ authorId: 'u1', createdAt }, undefined, hoursLater(1))).toBe(false)
  })
})

describe('validateDateRange', () => {
  it('acepta rangos vacíos, abiertos o en orden', () => {
    expect(validateDateRange()).toBeNull()
    expect(validateDateRange('2026-03-01')).toBeNull()
    expect(validateDateRange('2026-03-01', '2026-03-01')).toBeNull()
    expect(validateDateRange('2026-03-01', '2026-11-13')).toBeNull()
  })

  it('rechaza "desde" posterior a "hasta"', () => {
    expect(validateDateRange('2026-11-13', '2026-03-01')).toMatch(/posterior/)
  })
})

describe('buildInterventionParams', () => {
  it('manda solo los filtros elegidos', () => {
    expect(buildInterventionParams('s1', {}).toString()).toBe('studentId=s1')
    expect(
      buildInterventionParams('s1', {
        eventType: 'HEALTH',
        from: '2026-03-01',
        to: '2026-11-13',
      }).toString()
    ).toBe('studentId=s1&eventType=HEALTH&from=2026-03-01&to=2026-11-13')
  })
})

describe('summarize', () => {
  it('deja igual un texto corto y une los saltos de línea', () => {
    expect(summarize('Hola\n\nmundo')).toBe('Hola mundo')
  })

  it('corta un texto largo sin partir palabras', () => {
    const result = summarize('palabra '.repeat(50), 40)
    expect(result.endsWith('…')).toBe(true)
    expect(result).not.toMatch(/palab…$/)
    expect(result.length).toBeLessThanOrEqual(41)
  })
})
