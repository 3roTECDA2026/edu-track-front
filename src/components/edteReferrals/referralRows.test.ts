import { describe, expect, it } from 'vitest'

import {
  EMPTY_FILTERS,
  buildReferralRows,
  countWithoutPate,
  filterOptions,
  filterReferralRows,
} from '@/components/edteReferrals/referralRows'
import type { EdteReferral, PateSummary, ReferralSection } from '@/services/edteReferrals.service'

const section = (grade: number, division: string, shift: ReferralSection['shift'] = 'MORNING') => ({
  id: `s-${grade}${division}${shift}`,
  grade,
  division,
  shift,
})

const referral = (
  id: string,
  lastName: string,
  firstName: string,
  dni: string,
  overrides: Partial<EdteReferral> = {}
): EdteReferral => ({
  decisionId: `d-${id}`,
  decidedAt: '2026-02-10T12:00:00.000Z',
  pendingCountAtDecision: 5,
  pendingCount: 5,
  student: { id, firstName, lastName, dni },
  section: section(2, 'A'),
  pendingSubjects: [],
  ...overrides,
})

const pate = (studentId: string, status: PateSummary['status']): PateSummary => ({
  id: `p-${studentId}`,
  status,
  student: { id: studentId },
})

const referrals = [
  referral('s1', 'Pérez', 'Sofía', '45111222'),
  referral('s2', 'García', 'Mateo', '46222333', { section: section(3, 'B', 'AFTERNOON') }),
  referral('s3', 'Álvarez', 'Lucía', '47333444', { section: section(2, 'B') }),
  referral('s4', 'Díaz', 'Tomás', '48444555', { section: null }),
]

describe('buildReferralRows', () => {
  it('cruza cada alumno con su PATE y pone primero a los que no tienen', () => {
    const rows = buildReferralRows(referrals, [pate('s2', 'IN_PROGRESS'), pate('s3', 'CLOSED')])

    expect(rows.map((row) => row.lastName)).toEqual(['Díaz', 'Pérez', 'Álvarez', 'García'])
    expect(rows.map((row) => row.pate?.status ?? null)).toEqual([
      null,
      null,
      'CLOSED',
      'IN_PROGRESS',
    ])
    expect(countWithoutPate(rows)).toBe(2)
  })

  it('el borrador cuenta como PATE (no se resalta como "sin PATE")', () => {
    const rows = buildReferralRows([referrals[0]], [pate('s1', 'DRAFT')])
    expect(rows[0].pate).toEqual({ id: 'p-s1', status: 'DRAFT' })
    expect(countWithoutPate(rows)).toBe(0)
  })

  it('si el motor se corrió dos veces, deja una sola fila con la decisión más reciente', () => {
    const older = referral('s1', 'Pérez', 'Sofía', '45111222', {
      decisionId: 'old',
      decidedAt: '2026-02-01T12:00:00.000Z',
      pendingCount: 6,
    })
    const newer = referral('s1', 'Pérez', 'Sofía', '45111222', {
      decisionId: 'new',
      decidedAt: '2026-02-15T12:00:00.000Z',
      pendingCount: 5,
    })

    const rows = buildReferralRows([newer, older], [])
    expect(rows).toHaveLength(1)
    expect(rows[0].pendingCount).toBe(5)
  })

  it('sin derivados devuelve una lista vacía', () => {
    expect(buildReferralRows([], [pate('s1', 'IN_PROGRESS')])).toEqual([])
  })
})

describe('filterReferralRows', () => {
  const rows = buildReferralRows(referrals, [])
  const names = (filters: Partial<typeof EMPTY_FILTERS>) =>
    filterReferralRows(rows, { ...EMPTY_FILTERS, ...filters }).map((row) => row.lastName)

  it('sin filtros devuelve todo', () => {
    expect(names({})).toHaveLength(4)
  })

  it('filtra por año, sección y turno, y los combina', () => {
    expect(names({ grade: '2' })).toEqual(
      ['Álvarez', 'Pérez'].sort((a, b) => a.localeCompare(b, 'es'))
    )
    expect(names({ division: 'B' })).toEqual(['Álvarez', 'García'])
    expect(names({ shift: 'AFTERNOON' })).toEqual(['García'])
    expect(names({ grade: '2', division: 'B' })).toEqual(['Álvarez'])
  })

  it('un alumno sin curso no aparece si se filtra por curso', () => {
    expect(names({ grade: '2' })).not.toContain('Díaz')
  })

  it('busca por apellido o nombre sin importar mayúsculas ni acentos', () => {
    expect(names({ search: 'perez' })).toEqual(['Pérez'])
    expect(names({ search: 'ALVAREZ' })).toEqual(['Álvarez'])
    expect(names({ search: 'sofia perez' })).toEqual(['Pérez'])
    expect(names({ search: 'perez sofia' })).toEqual(['Pérez'])
    expect(names({ search: '  mateo ' })).toEqual(['García'])
  })

  it('busca por DNI, también parcial', () => {
    expect(names({ search: '46222333' })).toEqual(['García'])
    expect(names({ search: '4733' })).toEqual(['Álvarez'])
  })

  it('sin coincidencias devuelve una lista vacía', () => {
    expect(names({ search: 'zzz' })).toEqual([])
  })
})

describe('filterOptions', () => {
  it('ofrece solo los años, secciones y turnos del listado, ordenados', () => {
    expect(filterOptions(buildReferralRows(referrals, []))).toEqual({
      grades: [2, 3],
      divisions: ['A', 'B'],
      shifts: ['MORNING', 'AFTERNOON'],
    })
  })
})
