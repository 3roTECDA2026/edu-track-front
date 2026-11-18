// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ConflictsPage from '@/pages/ConflictsPage'
import { getStudentLegalConflicts, type LegalConflict } from '@/services/conflicts.service'

// El layout real y los adjuntos no hacen falta para probar el listado
vi.mock('@/components/layout/MainLayout', () => {
  const Layout = ({ children }: { children: ReactNode }) => <div>{children}</div>
  return { default: Layout, MainLayout: Layout }
})
vi.mock('@/components/conflicts/ConflictAttachments', () => ({ default: () => null }))

vi.mock('@/services/conflicts.service', () => ({
  getConflictCodes: vi.fn().mockResolvedValue([]),
  getStudentLegalConflicts: vi.fn(),
  createLegalConflict: vi.fn(),
}))

const students = [
  { id: 's1', dni: '40111222', firstName: 'Ana', lastName: 'Pérez' },
  { id: 's2', dni: '40333444', firstName: 'Luis', lastName: 'Gómez' },
]

const conflict = (id: string, withinDeadline: boolean | null, elapsedHours: number | null) =>
  ({
    id,
    occurrenceDate: '2026-11-10T12:00:00.000Z',
    registeredAt: '2026-11-10T14:00:00.000Z',
    withinDeadline,
    elapsedHours,
  }) as unknown as LegalConflict

const reply = (body: unknown) => ({
  ok: true,
  status: 200,
  statusText: '',
  json: async () => body,
})

function stubStudents() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).includes('/api/students?')) {
        return reply({ data: students, total: 2, page: 1, totalPages: 1 })
      }
      return reply([])
    })
  )
}

async function selectStudent(name: RegExp) {
  const [studentInput] = screen.getAllByRole('combobox')
  fireEvent.mouseDown(studentInput)
  fireEvent.click(await screen.findByText(name))
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ConflictsPage />
    </MemoryRouter>
  )
}

const FILTER_LABEL = 'Mostrar solo fuera de plazo'
const EMPTY_ALL = 'No se encontraron conflictos registrados para este alumno.'
const EMPTY_OVERDUE = 'Este alumno no tiene conflictos fuera de plazo.'

beforeEach(() => {
  stubStudents()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('listado de conflictos con indicador de plazo (CRM-094)', () => {
  it('un alumno sin conflictos ve el mensaje de que no hay registrados', async () => {
    vi.mocked(getStudentLegalConflicts).mockResolvedValue([])
    renderPage()

    await selectStudent(/Pérez, Ana/)

    expect(await screen.findByText(EMPTY_ALL)).toBeTruthy()
    expect(screen.queryByText(EMPTY_OVERDUE)).toBeNull()
    // Sin conflictos no hay nada que filtrar
    expect(screen.queryByLabelText(FILTER_LABEL)).toBeNull()
  })

  it('con el filtro prendido y ninguno fuera de plazo, muestra el mensaje del filtro', async () => {
    vi.mocked(getStudentLegalConflicts).mockResolvedValue([conflict('c1', true, 2)])
    renderPage()

    await selectStudent(/Pérez, Ana/)
    expect(await screen.findByText('Registrado en plazo')).toBeTruthy()

    fireEvent.click(screen.getByLabelText(FILTER_LABEL))

    expect(await screen.findByText(EMPTY_OVERDUE)).toBeTruthy()
    expect(screen.queryByText(EMPTY_ALL)).toBeNull()
  })

  it('con el filtro prendido muestra solo los conflictos fuera de plazo', async () => {
    vi.mocked(getStudentLegalConflicts).mockResolvedValue([
      conflict('c1', true, 2),
      conflict('c2', false, 30),
      conflict('c3', null, null),
    ])
    renderPage()

    await selectStudent(/Pérez, Ana/)
    expect(await screen.findByText('Registrado en plazo')).toBeTruthy()
    expect(screen.getByText('Sin fecha del suceso')).toBeTruthy()

    fireEvent.click(screen.getByLabelText(FILTER_LABEL))

    await waitFor(() => expect(screen.queryByText('Registrado en plazo')).toBeNull())
    expect(screen.getByText('Fuera de plazo (30 hs)')).toBeTruthy()
    // Sin fecha del suceso no cuenta como fuera de plazo
    expect(screen.queryByText('Sin fecha del suceso')).toBeNull()
  })

  it('al cambiar de alumno, el filtro vuelve a estar apagado', async () => {
    vi.mocked(getStudentLegalConflicts).mockResolvedValue([conflict('c1', false, 30)])
    renderPage()

    await selectStudent(/Pérez, Ana/)
    fireEvent.click(await screen.findByLabelText(FILTER_LABEL))
    expect((screen.getByLabelText(FILTER_LABEL) as HTMLInputElement).checked).toBe(true)

    await selectStudent(/Gómez, Luis/)

    await waitFor(() =>
      expect((screen.getByLabelText(FILTER_LABEL) as HTMLInputElement).checked).toBe(false)
    )
  })
})
