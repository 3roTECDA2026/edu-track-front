// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'

import { RiteTab } from '@/components/studentProfile/RiteTab'
import type { RiteDetail } from '@/services/rite.service'

// Pantalla del RITE con respuestas simuladas del back (CRM-044): un RITE firmado antes de este
// cambio (formato viejo) y RITE nuevos con y sin materias pendientes (MPAA).

const history = [
  {
    id: 'h1',
    year: 2025,
    grade: 2,
    division: 'A',
    section: '2° A',
    shift: 'MORNING',
    startDate: '2025-03-05',
    endDate: null,
    leaveReason: null,
  },
]

const riteSummary = (overrides: Partial<RiteDetail['rite']> = {}): RiteDetail['rite'] => ({
  id: 'r1',
  studentId: 's1',
  academicYearId: 'y2025',
  academicYear: 2025,
  term: 'SECOND',
  isPostIntensification: false,
  status: 'SIGNED',
  generalNotes: null,
  signedAt: '2025-12-10T12:00:00.000Z',
  signedBy: 'Marcela Quiroga',
  createdAt: '2025-12-01T12:00:00.000Z',
  updatedAt: '2025-12-10T12:00:00.000Z',
  ...overrides,
})

const subject = (name: string, december: unknown, february: unknown) => ({
  enrollmentId: name,
  type: 'C' as const,
  subjectName: name,
  gradeLevel: 1,
  term1: { preliminaryAssessment: 'TEA' as const, score: 7, observations: null },
  term2: { preliminaryAssessment: 'TEA' as const, score: 8, observations: null },
  intensification: { december, february },
  finalScore: 8,
})

const baseDocument = {
  institution: { name: 'Escuela Normal Secundaria', number: '10', district: 'Tandil' },
  academicYear: 2025,
  term: 'SECOND' as const,
  student: { id: 's1', firstName: 'Sofía', lastName: 'Pérez', dni: '45111222', recordNumber: '1' },
  section: { grade: 2, division: 'A', shift: 'MORNING' as const },
  attendance: {
    term1: { schoolDays: 90, absences: 3 },
    term2: { schoolDays: 88, absences: 2 },
    totalSchoolDays: 178,
    totalAbsences: 5,
  },
  generalNotes: null,
  notifications: [],
}

// Responde a los tres pedidos que hace la pestaña: historial, lista de RITE y detalle
function stubBackend(detail: RiteDetail) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const body = url.includes('/history')
        ? history
        : url.includes('/api/rites?')
          ? [detail.rite]
          : detail
      return { ok: true, json: async () => body }
    })
  )
}

// La pantalla arranca en el 1° cuatrimestre: se elige el 2° como lo haría una persona
async function openSecondTerm() {
  render(<RiteTab studentId="s1" />)
  const select = await screen.findByRole('combobox', { name: /período/i })
  fireEvent.mouseDown(select)
  fireEvent.click(await screen.findByRole('option', { name: /2° cuatrimestre/i }))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('RiteTab con un RITE firmado antes de CRM-044', () => {
  const legacy: RiteDetail = {
    rite: riteSummary(),
    // Sin pendingSubjects, sin term1IntensificationScore y con diciembre y febrero como número
    document: {
      ...baseDocument,
      subjects: [
        subject('Matemática', null, null),
        subject('Lengua', 4, null),
        subject('Historia', null, 6),
      ],
    } as unknown as RiteDetail['document'],
  }

  it('muestra el aviso en lugar de la tabla de MPAA, sin romperse', async () => {
    stubBackend(legacy)
    await openSecondTerm()
    expect(
      await screen.findByText(
        /se firmó antes de que se incorporara la tabla de materias pendientes/i
      )
    ).toBeTruthy()
  })

  it('muestra la nota suelta de diciembre y febrero como antes', async () => {
    stubBackend(legacy)
    await openSecondTerm()
    const lengua = (await screen.findByText('Lengua')).closest('tr') as HTMLElement
    const cells = within(lengua)
      .getAllByRole('cell')
      .map((cell) => cell.textContent)
    // Tipo, materia, año, 1° val., calif. 1° C, 2° val., calif. 2° C, int. 1° C, dic., feb., final
    expect(cells[8]).toBe('4') // diciembre
    expect(cells[9]).toBe('—') // febrero sin dato
    const historia = screen.getByText('Historia').closest('tr') as HTMLElement
    expect(within(historia).getAllByRole('cell')[9]?.textContent).toBe('6')
  })
})

describe('RiteTab con un RITE nuevo', () => {
  const withPending = (pendingSubjects: unknown[], total = pendingSubjects.length): RiteDetail => ({
    rite: riteSummary({ status: 'DRAFT', signedAt: null, signedBy: null }),
    document: {
      ...baseDocument,
      subjects: [
        subject('Lengua', { score: null, resultCode: 'CCA' }, { score: 5, resultCode: 'AA' }),
        subject('Biología', { score: null, resultCode: 'CSA' }, { score: null, resultCode: null }),
      ],
      pendingSubjects,
      pendingSubjectsTotal: total,
    } as unknown as RiteDetail['document'],
  })

  const pending = (name: string) => ({
    subjectName: name,
    gradeLevel: 2,
    originYear: 2024,
    initialPendingKnowledge: 'Saberes iniciales',
    results: {
      MARCH: 'CSA',
      JULY: 'AA',
      AUGUST: null,
      DECEMBER_TERM_CLOSE: null,
      DECEMBER: null,
      FEBRUARY_MARCH: null,
    },
    finalScore: 6,
    closingPendingKnowledge: null,
  })

  it('diciembre y febrero muestran el código con CCA/CSA y la nota con AA', async () => {
    stubBackend(withPending([]))
    await openSecondTerm()
    const lengua = (await screen.findByText('Lengua')).closest('tr') as HTMLElement
    const cells = within(lengua)
      .getAllByRole('cell')
      .map((cell) => cell.textContent)
    expect(cells[8]).toBe('CCA')
    expect(cells[9]).toBe('5')
    const biologia = screen.getByText('Biología').closest('tr') as HTMLElement
    expect(within(biologia).getAllByRole('cell')[8]?.textContent).toBe('CSA')
  })

  it('sin MPAA: dice que no hay materias pendientes', async () => {
    stubBackend(withPending([]))
    await openSecondTerm()
    expect(
      await screen.findByText(/no tiene materias pendientes de ciclos anteriores/i)
    ).toBeTruthy()
  })

  it('con MPAA: las muestra en la tabla', async () => {
    stubBackend(withPending([pending('Física'), pending('Química')]))
    await openSecondTerm()
    expect(await screen.findByText('Física')).toBeTruthy()
    expect(screen.getByText('Química')).toBeTruthy()
  })

  it('con más de 4 MPAA: avisa cuántas no se muestran', async () => {
    stubBackend(
      withPending(
        [1, 2, 3, 4].map((n) => pending(`Materia ${n}`)),
        6
      )
    )
    await openSecondTerm()
    expect(await screen.findByText(/tiene 6 materias pendientes/i)).toBeTruthy()
    expect(screen.getByText(/2 no se muestran/i)).toBeTruthy()
  })
})
