// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SubjectRepeatsTab } from '@/components/subjectRepeats/SubjectRepeatsTab'
import type { RepeatOptions, SubjectRepeat } from '@/services/subjectRepeats.service'
import { withNotifications } from '@/test/edteTestUtils'

// Recursado de Geografía (2.º año, MPAA de 2025) en 2° B Tarde de 2026
const repeat = (overrides: Partial<SubjectRepeat> = {}): SubjectRepeat => ({
  id: 'r1',
  student: { id: 's1', dni: '1', firstName: 'Mateo', lastName: 'García' },
  subject: { id: 'geo', name: 'Geografía', gradeLevel: 2 },
  classSection: { id: 'sec-2b', grade: 2, division: 'B', shift: 'AFTERNOON' },
  academicYear: { id: 'y2026', year: 2026 },
  pendingSubject: { id: 'p-geo', status: 'PENDING', originYear: 2025 },
  hasGrade: false,
  attendanceCount: 0,
  pateId: null,
  ...overrides,
})

const options = (subjectCount = 10): RepeatOptions => ({
  activeCycle: { id: 'y2026', year: 2026 },
  subjectCount,
  maxSubjects: 12,
  options: [
    {
      pendingSubjectId: 'p-geo',
      subject: { id: 'geo', name: 'Geografía' },
      originYear: 2025,
      gradeLevel: 2,
      currentRepeat: null,
      blockReason: null,
      sections: [
        { id: 'sec-2a', grade: 2, division: 'A', shift: 'MORNING' },
        { id: 'sec-2b', grade: 2, division: 'B', shift: 'AFTERNOON' },
      ],
    },
    {
      pendingSubjectId: 'p-hist',
      subject: { id: 'hist', name: 'Historia' },
      originYear: 2025,
      gradeLevel: 3,
      currentRepeat: null,
      blockReason: 'La materia tiene una intensificación sin resultado',
      sections: [],
    },
  ],
})

// Responde como el back ({ success, data }) y guarda cada pedido para revisarlo
function stubBack({ repeats = [] as SubjectRepeat[], failDelete = false, subjectCount = 10 } = {}) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    if (method === 'DELETE' && failDelete) {
      return {
        ok: false,
        status: 409,
        json: async () => ({ error: 'El recursado ya tiene notas cargadas: no se puede quitar' }),
      }
    }
    const data = url.includes('/options') ? options(subjectCount) : method === 'GET' ? repeats : {}
    return { ok: true, status: 200, json: async () => ({ success: true, data, message: '' }) }
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const calls = (fetchMock: ReturnType<typeof stubBack>, method: string) =>
  fetchMock.mock.calls.filter(([, init]) => (init?.method ?? 'GET') === method)

const renderTab = (canManage = true) =>
  render(
    withNotifications(
      <SubjectRepeatsTab studentId="s1" studentName="García, Mateo" canManage={canManage} />
    )
  )

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('pestaña de recursados (CRM-082)', () => {
  it('sin recursados muestra el mensaje de vacío', async () => {
    stubBack()
    renderTab()
    expect(await screen.findByText('Sin recursados')).toBeTruthy()
  })

  it('lista materia, año, sección, turno, ciclo, origen y la MPAA (CRM-083)', async () => {
    stubBack({ repeats: [repeat()] })
    renderTab()
    expect(await screen.findByText('Materias a recursar')).toBeTruthy()
    const row = (await screen.findByText('Geografía')).closest('tr') as HTMLElement
    expect(within(row).getByText('2°')).toBeTruthy()
    expect(within(row).getByText('2° B')).toBeTruthy()
    expect(within(row).getByText('Tarde')).toBeTruthy()
    expect(within(row).getByText('2026')).toBeTruthy()
    expect(within(row).getByText('Manual')).toBeTruthy()
    expect(within(row).getByText('Pendiente de 2025')).toBeTruthy()
  })

  it('el recursado que creó un PATE figura con origen PATE (CRM-083)', async () => {
    stubBack({ repeats: [repeat({ pateId: 'pate1' })] })
    renderTab()
    const row = (await screen.findByText('Geografía')).closest('tr') as HTMLElement
    expect(within(row).getByText('PATE')).toBeTruthy()
  })

  it('muestra el contador de materias del ciclo (CRM-083)', async () => {
    stubBack({ subjectCount: 10 })
    renderTab()
    expect(await screen.findByText('Materias del ciclo: 10/12')).toBeTruthy()
    const button = screen.getByRole('button', { name: /asignar recursado/i })
    expect((button as HTMLButtonElement).disabled).toBe(false)
  })

  it('con 12 materias en el ciclo no deja asignar otro recursado (CRM-083)', async () => {
    stubBack({ subjectCount: 12 })
    renderTab()
    expect(await screen.findByText('Materias del ciclo: 12/12')).toBeTruthy()
    const button = screen.getByRole('button', { name: /asignar recursado/i })
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })

  it('quien solo ve no tiene el botón de asignar ni las acciones', async () => {
    stubBack({ repeats: [repeat()] })
    renderTab(false)
    await screen.findByText('Geografía')
    expect(screen.queryByRole('button', { name: /asignar recursado/i })).toBeNull()
    expect(screen.queryByText(/materias del ciclo/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /quitar/i })).toBeNull()
  })

  it('con la MPAA acreditada no se puede editar ni quitar', async () => {
    stubBack({
      repeats: [
        repeat({ pendingSubject: { id: 'p-geo', status: 'ACCREDITED', originYear: 2025 } }),
      ],
    })
    renderTab()
    expect(await screen.findByText('Pendiente de 2025 · acreditada')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /quitar/i })).toBeNull()
  })

  it('si lo creó un PATE, el botón de quitar está deshabilitado', async () => {
    stubBack({ repeats: [repeat({ pateId: 'pate1' })] })
    renderTab()
    const button = await screen.findByRole('button', { name: /quitar/i })
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })

  it('con notas cargadas el botón de quitar está deshabilitado', async () => {
    stubBack({ repeats: [repeat({ hasGrade: true })] })
    renderTab()
    const button = await screen.findByRole('button', { name: /quitar/i })
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })

  it('quitar pide confirmación y recién ahí llama al back', async () => {
    const fetchMock = stubBack({ repeats: [repeat()] })
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /quitar/i }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('¿Quitar el recursado de Geografía?')).toBeTruthy()
    expect(calls(fetchMock, 'DELETE')).toHaveLength(0)

    fireEvent.click(within(dialog).getByRole('button', { name: 'Quitar' }))
    await waitFor(() => expect(calls(fetchMock, 'DELETE')).toHaveLength(1))
    expect(calls(fetchMock, 'DELETE')[0][0]).toContain('/api/subject-repeats/r1')
    expect(await screen.findByText('Se quitó el recursado de Geografía.')).toBeTruthy()
  })

  it('si el back rechaza la baja, muestra su mensaje', async () => {
    stubBack({ repeats: [repeat()], failDelete: true })
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /quitar/i }))
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Quitar' })
    )
    expect(await screen.findByText(/ya tiene notas cargadas/)).toBeTruthy()
  })
})

describe('diálogo de alta del recursado (CRM-082)', () => {
  const openDialog = async () => {
    fireEvent.click(await screen.findByRole('button', { name: /asignar recursado/i }))
    return screen.findByRole('dialog')
  }

  it('una MPAA bloqueada aparece deshabilitada y con el motivo', async () => {
    stubBack()
    renderTab()
    const dialog = await openDialog()
    await within(dialog).findByText(/ciclo lectivo 2026/i)
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: /materia pendiente/i }))
    const blocked = await screen.findByRole('option', { name: /historia/i })
    expect(blocked.getAttribute('aria-disabled')).toBe('true')
    expect(within(blocked).getByText(/intensificación sin resultado/)).toBeTruthy()
  })

  it('el año sale de la materia y las secciones se filtran por turno (CRM-083)', async () => {
    stubBack()
    renderTab()
    const dialog = await openDialog()
    await within(dialog).findByText(/ciclo lectivo 2026/i)

    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: /materia pendiente/i }))
    fireEvent.click(await screen.findByRole('option', { name: /geografía/i }))
    expect((within(dialog).getByLabelText('Año') as HTMLInputElement).value).toBe('2.º año')

    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: /^turno/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Mañana' }))
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: /sección donde recursa/i }))
    expect(await screen.findByRole('option', { name: '2° A' })).toBeTruthy()
    expect(screen.queryByRole('option', { name: '2° B' })).toBeNull()
  })

  it('asigna la MPAA en la sección elegida, aunque sea de otro turno', async () => {
    const fetchMock = stubBack()
    renderTab()
    const dialog = await openDialog()
    await within(dialog).findByText(/ciclo lectivo 2026/i)

    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: /materia pendiente/i }))
    fireEvent.click(await screen.findByRole('option', { name: /geografía/i }))
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: /^turno/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Tarde' }))
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: /sección donde recursa/i }))
    fireEvent.click(await screen.findByRole('option', { name: '2° B' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Asignar' }))

    await waitFor(() => expect(calls(fetchMock, 'POST')).toHaveLength(1))
    const [url, init] = calls(fetchMock, 'POST')[0]
    expect(url).toContain('/api/subject-repeats')
    expect(JSON.parse(String(init?.body))).toEqual({
      pendingSubjectId: 'p-geo',
      classSectionId: 'sec-2b',
    })
    expect(await screen.findByText('García, Mateo recursa Geografía.')).toBeTruthy()
  })
})
