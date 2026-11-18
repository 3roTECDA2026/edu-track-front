// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InterventionsTab } from '@/components/studentProfile/InterventionsTab'
import { stubApi, withNotifications } from '@/test/edteTestUtils'

const intervention = {
  id: 'i1',
  studentId: 's1',
  classSectionId: 'cs1',
  authorId: 'u1',
  eventType: 'HEALTH',
  description: 'Se descompensó en el recreo y se llamó a la familia.',
  interventionProposal: 'Pedir certificado médico.',
  involvedActors: 'Preceptoría, Madre',
  date: '2026-11-10T03:00:00.000Z',
  createdAt: '2026-11-10T15:00:00.000Z',
  author: { id: 'u1', firstName: 'Marcela', lastName: 'Quiroga' },
  classSection: { id: 'cs1', grade: 3, division: 'A', shift: 'MORNING' },
  _count: { attachments: 2 },
}

const page = (items: unknown[]) => ({
  data: { data: items, page: 1, limit: 100, total: items.length, totalPages: 1 },
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('pestaña Intervenciones: línea de tiempo (CRM-088)', () => {
  it('muestra cada intervención con tipo, autor y cantidad de adjuntos', async () => {
    stubApi([[(url) => url.includes('/api/interventions?'), page([intervention])]])
    render(withNotifications(<InterventionsTab studentId="s1" />))

    expect(await screen.findByText('Salud')).toBeTruthy()
    expect(screen.getByText('Registró: Quiroga, Marcela')).toBeTruthy()
    expect(screen.getByText('2 adjuntos')).toBeTruthy()
  })

  it('al hacer clic se abre el detalle con todos los datos', async () => {
    stubApi([[(url) => url.includes('/api/interventions?'), page([intervention])]])
    render(withNotifications(<InterventionsTab studentId="s1" />))

    fireEvent.click(await screen.findByRole('button', { name: /ver detalle de la intervención/i }))

    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Pedir certificado médico.')).toBeTruthy()
    expect(screen.getByText('Curso: 3° A')).toBeTruthy()
  })

  it('al filtrar por tipo, vuelve a pedir el listado con ese filtro', async () => {
    const fetchMock = stubApi([[(url) => url.includes('/api/interventions?'), page([])]])
    render(withNotifications(<InterventionsTab studentId="s1" />))
    await screen.findByText('Sin intervenciones')

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /tipo de evento/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Conductual' }))

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes('eventType=CONDUCT'))).toBe(
        true
      )
    )
    expect(await screen.findByText('No hay intervenciones con los filtros elegidos.')).toBeTruthy()
  })

  it('con "desde" posterior a "hasta" avisa y no pide nada', async () => {
    const fetchMock = stubApi([[(url) => url.includes('/api/interventions?'), page([])]])
    render(withNotifications(<InterventionsTab studentId="s1" />))
    await screen.findByText('Sin intervenciones')
    const callsBefore = fetchMock.mock.calls.length

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-13' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-03-01' } })

    expect(await screen.findByText(/no puede ser posterior/i)).toBeTruthy()
    // Pasada la espera de los filtros, tampoco se pidió nada: el rango quedó inválido
    await new Promise((resolve) => setTimeout(resolve, 600))
    expect(fetchMock.mock.calls.length).toBe(callsBefore)
  })

  it('al escribir una fecha, espera a que se termine de escribir para consultar', async () => {
    const fetchMock = stubApi([[(url) => url.includes('/api/interventions?'), page([])]])
    render(withNotifications(<InterventionsTab studentId="s1" />))
    await screen.findByText('Sin intervenciones')
    const callsBefore = fetchMock.mock.calls.length

    // Tres cambios seguidos, como al tipear: solo se consulta con el último
    const from = screen.getByLabelText('Desde')
    fireEvent.change(from, { target: { value: '2026-01-01' } })
    fireEvent.change(from, { target: { value: '2026-02-01' } })
    fireEvent.change(from, { target: { value: '2026-03-01' } })

    await waitFor(() => expect(fetchMock.mock.calls.length).toBe(callsBefore + 1))
    const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]
    expect(String(lastCall?.[0])).toContain('from=2026-03-01')
  })
})
