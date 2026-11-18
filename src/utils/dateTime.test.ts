import { describe, expect, it } from 'vitest'

import { formatDateTime } from '@/utils/dateTime'

// Hora local de la máquina que corre los tests: se arma la fecha en hora local para no depender
// de la zona horaria.
const evening = new Date(2026, 10, 17, 21, 25, 37)
const morning = new Date(2026, 10, 17, 9, 5, 0)

describe('formatDateTime', () => {
  it('usa reloj de 24 horas: las 21:25 no se muestran como 09:25', () => {
    expect(formatDateTime(evening)).toBe('17/11/2026, 21:25')
  })

  it('distingue la mañana de la noche', () => {
    expect(formatDateTime(morning)).toBe('17/11/2026, 09:05')
  })

  it('puede incluir los segundos', () => {
    expect(formatDateTime(evening, { seconds: true })).toBe('17/11/2026, 21:25:37')
  })

  it('acepta el texto ISO que manda el back', () => {
    expect(formatDateTime(evening.toISOString())).toBe('17/11/2026, 21:25')
  })

  it('devuelve null si la fecha no es válida', () => {
    expect(formatDateTime('no-es-una-fecha')).toBeNull()
  })
})
