// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import EdteReferralsPage from '@/pages/EdteReferralsPage'
import type { EdteReferral, PateSummary } from '@/services/edteReferrals.service'

// El año actual define qué se pide: derivados del año anterior y PATE del actual
const YEAR = new Date().getFullYear()

const referral = (id: string, lastName: string, firstName: string, dni: string): EdteReferral => ({
  decisionId: `d-${id}`,
  decidedAt: `${YEAR}-02-10T12:00:00.000Z`,
  pendingCountAtDecision: 5,
  pendingCount: 5,
  student: { id, firstName, lastName, dni },
  section: { id: 'c1', grade: 2, division: 'A', shift: 'MORNING' },
  pendingSubjects: [],
})

const REFERRALS = [
  referral('s1', 'Pérez', 'Sofía', '45111222'),
  referral('s2', 'García', 'Mateo', '46222333'),
]
const PATES: PateSummary[] = [{ id: 'p2', status: 'IN_PROGRESS', student: { id: 's2' } }]

type Reply = { status?: number; body: unknown }

// Respuestas del back por ruta. Devuelve el mock para ver qué se pidió.
function stubApi(replies: Record<string, Reply>) {
  const fetchMock = vi.fn(async (url: string) => {
    const path = new URL(url).pathname
    const reply = replies[path] ?? { body: [] }
    const status = reply.status ?? 200
    return { ok: status < 400, status, json: async () => reply.body }
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const requested = (fetchMock: ReturnType<typeof stubApi>) =>
  fetchMock.mock.calls.map(([url]) => {
    const { pathname, search } = new URL(url as string)
    return pathname + search
  })

// Muestra a dónde navegó la página
const Location = () => {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/edte-referrals']}>
      <Routes>
        <Route path="/edte-referrals" element={<EdteReferralsPage />} />
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>
  )

beforeEach(() => {
  sessionStorage.setItem('token', `x.${btoa(JSON.stringify({ role: 'EOE_DIRECTIVE' }))}.y`)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

describe('EdteReferralsPage', () => {
  it('lista los derivados con su PATE y cuenta los que no tienen', async () => {
    const fetchMock = stubApi({
      '/api/edte-referrals': { body: REFERRALS },
      '/api/pates': { body: PATES },
    })
    renderPage()

    expect(await screen.findByText('Pérez, Sofía')).toBeTruthy()
    expect(screen.getByText('García, Mateo')).toBeTruthy()
    expect(screen.getByText('Sin PATE')).toBeTruthy()
    expect(screen.getByText('En curso')).toBeTruthy()
    expect(screen.getByText(/sin PATE$/).textContent).toBe('1 de 2 sin PATE')
    expect(requested(fetchMock)).toEqual(
      expect.arrayContaining([`/api/edte-referrals?year=${YEAR - 1}`, `/api/pates?year=${YEAR}`])
    )
  })

  it('el buscador filtra por nombre o DNI y avisa si no hay coincidencias', async () => {
    stubApi({ '/api/edte-referrals': { body: REFERRALS }, '/api/pates': { body: PATES } })
    renderPage()
    await screen.findByText('Pérez, Sofía')

    const search = screen.getByLabelText('Buscar por nombre, apellido o DNI')
    fireEvent.change(search, { target: { value: '4622' } })
    expect(screen.queryByText('Pérez, Sofía')).toBeNull()
    expect(screen.getByText('García, Mateo')).toBeTruthy()

    fireEvent.change(search, { target: { value: 'zzz' } })
    expect(screen.getByText('Ningún derivado coincide con los filtros.')).toBeTruthy()
  })

  it('sin derivados muestra un mensaje', async () => {
    stubApi({ '/api/edte-referrals': { body: [] }, '/api/pates': { body: [] } })
    renderPage()
    expect(
      await screen.findByText(`No hay alumnos derivados al cierre de ${YEAR - 1}.`)
    ).toBeTruthy()
  })

  it('con 403 avisa que no tiene acceso', async () => {
    stubApi({ '/api/edte-referrals': { status: 403, body: { error: 'Prohibido' } } })
    renderPage()
    expect(await screen.findByText('No tenés acceso al listado de derivados al EDTE.')).toBeTruthy()
  })

  it('si falla, muestra el error y permite reintentar', async () => {
    const fetchMock = stubApi({
      '/api/edte-referrals': { status: 500, body: { error: 'Se cayó la base' } },
    })
    renderPage()
    expect(await screen.findByText(/No se pudo cargar el listado de derivados/)).toBeTruthy()

    fetchMock.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() =>
      expect(requested(fetchMock)).toContain(`/api/edte-referrals?year=${YEAR - 1}`)
    )
  })

  it('si fallan los PATE, muestra el listado con un aviso', async () => {
    stubApi({
      '/api/edte-referrals': { body: REFERRALS },
      '/api/pates': { status: 500, body: { error: 'Falló' } },
    })
    renderPage()
    expect(await screen.findByText('Pérez, Sofía')).toBeTruthy()
    expect(screen.getByText(/No se pudo consultar el estado de los PATE/)).toBeTruthy()
    expect(screen.queryByText('Sin PATE')).toBeNull()
  })

  it('"Ver ficha" lleva a la ficha del alumno', async () => {
    stubApi({ '/api/edte-referrals': { body: REFERRALS }, '/api/pates': { body: PATES } })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Ver ficha de Pérez, Sofía' }))
    expect(screen.getByTestId('location').textContent).toBe('/students/s1')
  })

  it('"Agregar a reunión" ofrece las reuniones en borrador y lleva al formulario con el alumno', async () => {
    const fetchMock = stubApi({
      '/api/edte-referrals': { body: REFERRALS },
      '/api/pates': { body: PATES },
      '/api/edte-meetings': {
        body: [{ id: 'm1', date: `${YEAR}-03-04`, period: 'FEBRUARY_MARCH', studentsCount: 2 }],
      },
    })
    renderPage()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Agregar a Pérez, Sofía a una reunión' })
    )

    const dialog = within(await screen.findByRole('dialog'))
    fireEvent.click(await dialog.findByText(`04/03/${YEAR} · Febrero / Marzo`))
    expect(requested(fetchMock)).toContain(`/api/edte-meetings?year=${YEAR}&status=DRAFT`)
    expect(screen.getByTestId('location').textContent).toBe('/edte-meetings/m1/edit?studentId=s1')
  })

  it('"Nueva reunión" lleva al alta con el alumno ya elegido', async () => {
    stubApi({ '/api/edte-referrals': { body: REFERRALS }, '/api/pates': { body: PATES } })
    renderPage()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Agregar a García, Mateo a una reunión' })
    )
    const dialog = within(await screen.findByRole('dialog'))
    expect(await dialog.findByText(`No hay reuniones en borrador en ${YEAR}.`)).toBeTruthy()
    fireEvent.click(dialog.getByRole('button', { name: 'Nueva reunión' }))
    expect(screen.getByTestId('location').textContent).toBe('/edte-meetings/new?studentId=s2')
  })

  it('al cambiar el ciclo del PATE pide los derivados del ciclo anterior a ese', async () => {
    const fetchMock = stubApi({
      '/api/edte-referrals': { body: REFERRALS },
      '/api/pates': { body: PATES },
    })
    renderPage()
    await screen.findByText('Pérez, Sofía')

    fireEvent.mouseDown(screen.getByLabelText('Ciclo del PATE'))
    fireEvent.click(within(screen.getByRole('listbox')).getByText(String(YEAR - 1)))
    await waitFor(() =>
      expect(requested(fetchMock)).toEqual(
        expect.arrayContaining([
          `/api/edte-referrals?year=${YEAR - 2}`,
          `/api/pates?year=${YEAR - 1}`,
        ])
      )
    )
    expect(
      screen.getByText(`Derivados al cierre de ${YEAR - 2} · PATE del ciclo ${YEAR - 1}`)
    ).toBeTruthy()
  })
})
