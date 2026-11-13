import { describe, expect, it } from 'vitest'

import { intensificationText } from '@/utils/rite'

// Columnas de diciembre y febrero de la página 1 del RITE (Res. 1650/24, Anexo 5): con AA va la
// nota; con CCA o CSA, el código. Los RITE firmados antes de CRM-044 guardaron solo un número.
describe('intensificationText', () => {
  describe('formato nuevo { score, resultCode }', () => {
    it('AA con nota: va la nota', () => {
      expect(intensificationText({ score: 5, resultCode: 'AA' })).toBe('5')
    })

    it('AA con nota con decimales: va con coma', () => {
      expect(intensificationText({ score: 7.5, resultCode: 'AA' })).toBe('7,5')
    })

    it('AA sin nota cargada: va el código, para que la celda no quede vacía', () => {
      expect(intensificationText({ score: null, resultCode: 'AA' })).toBe('AA')
    })

    it('CCA: va el código y no la nota', () => {
      expect(intensificationText({ score: null, resultCode: 'CCA' })).toBe('CCA')
      expect(intensificationText({ score: 3, resultCode: 'CCA' })).toBe('CCA')
    })

    it('CSA: va el código y no la nota', () => {
      expect(intensificationText({ score: null, resultCode: 'CSA' })).toBe('CSA')
      expect(intensificationText({ score: 2, resultCode: 'CSA' })).toBe('CSA')
    })

    it('sin intento en el período: la celda queda vacía', () => {
      expect(intensificationText({ score: null, resultCode: null })).toBe('')
    })
  })

  describe('RITE firmados antes de este cambio (solo la nota)', () => {
    it('un número se imprime como antes', () => {
      expect(intensificationText(6)).toBe('6')
      expect(intensificationText(7.5)).toBe('7,5')
    })

    it('sin dato: la celda queda vacía', () => {
      expect(intensificationText(null)).toBe('')
      expect(intensificationText(undefined)).toBe('')
    })
  })
})
