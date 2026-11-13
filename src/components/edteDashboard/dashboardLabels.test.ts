import { describe, expect, it } from 'vitest'

import {
  LEVEL_CONFIG,
  earlyWarningHint,
  levelDescription,
  referredHint,
} from '@/components/edteDashboard/dashboardLabels'
import { LEVEL_ICONS } from '@/components/edteDashboard/levelIcons'
import type { DashboardThresholds } from '@/services/edteDashboard.service'

const DEFAULT: DashboardThresholds = {
  earlyWarningPending: 4,
  referredPending: 5,
  mediumTedCount: 1,
  highTedCount: 2,
}

// Los textos del semáforo salen de los umbrales que informa el back: si el back cambia una
// regla, el texto cambia solo y nunca queda desactualizado
describe('textos del semáforo', () => {
  it('con los umbrales de hoy', () => {
    expect(levelDescription('HIGH', DEFAULT)).toBe(
      '5 o más materias pendientes, o 2 o más materias con TED'
    )
    expect(levelDescription('MEDIUM', DEFAULT)).toBe(
      '4 materias pendientes, 1 materia con TED, o valoración TEP'
    )
    expect(levelDescription('LOW', DEFAULT)).toBe('Sin señales de alerta')
    expect(referredHint(DEFAULT)).toBe('5 o más materias pendientes')
    expect(earlyWarningHint(DEFAULT)).toBe('4 materias pendientes')
  })

  it('si el back cambia los umbrales, cambian los textos', () => {
    const changed: DashboardThresholds = {
      earlyWarningPending: 5,
      referredPending: 6,
      mediumTedCount: 2,
      highTedCount: 3,
    }
    expect(levelDescription('HIGH', changed)).toBe(
      '6 o más materias pendientes, o 3 o más materias con TED'
    )
    expect(levelDescription('MEDIUM', changed)).toContain('2 materias con TED')
    expect(referredHint(changed)).toBe('6 o más materias pendientes')
    expect(earlyWarningHint(changed)).toBe('5 materias pendientes')
  })
})

describe('semáforo: no depende solo del color', () => {
  it.each(['HIGH', 'MEDIUM', 'LOW'] as const)(
    'el nivel %s tiene texto e ícono propios',
    (level) => {
      expect(LEVEL_CONFIG[level].text).toMatch(/^Riesgo /)
      expect(LEVEL_CONFIG[level].label.length).toBeGreaterThan(0)
      expect(LEVEL_ICONS[level]).toBeTruthy()
    }
  )

  it('cada nivel tiene un ícono y un color distintos', () => {
    const icons = new Set(Object.values(LEVEL_ICONS))
    const colors = new Set(Object.values(LEVEL_CONFIG).map((config) => config.color))
    expect(icons.size).toBe(3)
    expect(colors.size).toBe(3)
  })
})
