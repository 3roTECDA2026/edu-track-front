// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import InterventionFormPage from '@/pages/InterventionFormPage'
import { withNotifications } from '@/test/edteTestUtils'

// El layout real no hace falta para probar el formulario
vi.mock('@/components/layout/MainLayout', () => {
  const Layout = ({ children }: { children: ReactNode }) => <div>{children}</div>
  return { default: Layout, MainLayout: Layout }
})

const student = {
  id: 's1',
  dni: '40111222',
  firstName: 'Ana',
  lastName: 'Pérez',
  recordNumber: '123',
  status: 'ACTIVE',
  currentSection: null,
}
const sections = [{ id: 'cs1', year: 2026, grade: 3, division: 'A', shift: 'MORNING' }]

const reply = (status: number, body: unknown) => ({
  ok: status < 400,
  status,
  statusText: '',
  json: async () => body,
})

// Back de mentira: crear la intervención funciona, pero subir los archivos siempre falla.
function stubBackWithFailingUpload() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    if (url.includes('/attachments')) return reply(500, { error: 'Error al guardar el archivo' })
    if (method === 'POST' && url.endsWith('/api/interventions')) {
      return reply(201, { data: { id: 'i1' } })
    }
    if (url.includes('/api/students/s1')) return reply(200, student)
    if (url.includes('/api/students?'))
      return reply(200, { data: [], total: 0, page: 1, totalPages: 0 })
    if (url.includes('/api/class-sections')) return reply(200, sections)
    return reply(200, [])
  })
  vi.stubGlobal('fetch', fetchMock)

  const callsTo = (match: (url: string, method: string) => boolean) =>
    fetchMock.mock.calls.filter(([url, init]) => match(String(url), init?.method ?? 'GET')).length

  return {
    createCalls: () =>
      callsTo((url, method) => method === 'POST' && url.endsWith('/api/interventions')),
    uploadCalls: () => callsTo((url) => url.includes('/attachments')),
  }
}

function renderForm() {
  return render(
    withNotifications(
      <MemoryRouter initialEntries={['/interventions/new?studentId=s1&classSectionId=cs1']}>
        <Routes>
          <Route path="/interventions/new" element={<InterventionFormPage />} />
          <Route path="/students/:id" element={<p>FICHA</p>} />
        </Routes>
      </MemoryRouter>
    )
  )
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('formulario de intervención con adjuntos (CRM-087)', () => {
  it('si falla la subida, permite reintentar sin crear otra intervención', async () => {
    const back = stubBackWithFailingUpload()
    const { container } = renderForm()

    // Esperar a que cargue el alumno que viene de la ficha
    await screen.findByDisplayValue('Pérez, Ana (DNI 40111222)')

    // Completar los obligatorios que faltan: tipo de evento y situación
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /tipo de evento/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Pedagógico' }))
    fireEvent.change(screen.getByLabelText(/situación detectada/i), {
      target: { value: 'No entrega las tareas' },
    })

    // Elegir un archivo (un PDF, para que no haga falta generar una miniatura)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['%PDF-1.7'], 'acta.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    expect(screen.getByText('acta.pdf')).toBeTruthy()

    // Guardar: se crea la intervención, pero la subida falla
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText(/no se pudieron subir los archivos/i)).toBeTruthy()
    const retryButton = await screen.findByRole('button', { name: /reintentar subida/i })
    // Los campos quedan bloqueados: la intervención ya está guardada
    expect((screen.getByLabelText(/situación detectada/i) as HTMLTextAreaElement).disabled).toBe(
      true
    )
    expect(back.createCalls()).toBe(1)
    expect(back.uploadCalls()).toBe(1)

    // Reintentar: solo se vuelve a intentar la subida
    fireEvent.click(retryButton)

    await waitFor(() => expect(back.uploadCalls()).toBe(2))
    expect(back.createCalls()).toBe(1)
  })

  it('no deja guardar con un archivo de un tipo no permitido', async () => {
    const back = stubBackWithFailingUpload()
    const { container } = renderForm()
    await screen.findByDisplayValue('Pérez, Ana (DNI 40111222)')

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /tipo de evento/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Pedagógico' }))
    fireEvent.change(screen.getByLabelText(/situación detectada/i), {
      target: { value: 'No entrega las tareas' },
    })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'virus.exe')] } })

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    // Avisa en el selector y no manda nada al back
    expect(await screen.findByText(/"virus.exe": tipo de archivo no permitido/i)).toBeTruthy()
    expect(back.createCalls()).toBe(0)
    expect(back.uploadCalls()).toBe(0)
  })
})
