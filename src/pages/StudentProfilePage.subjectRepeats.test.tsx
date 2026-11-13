// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import StudentProfilePage from '@/pages/StudentProfilePage'
import type { StudentDetail } from '@/services/students.service'
import { loginAs, withNotifications } from '@/test/edteTestUtils'

// El layout (menú, encabezado) no es lo que se prueba
vi.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const student = (id: string, firstName: string): StudentDetail => ({
  id,
  dni: id,
  firstName,
  lastName: 'García',
  dateOfBirth: '2010-05-01',
  placeOfBirth: 'Tandil',
  address: 'Calle 1',
  city: 'Tandil',
  phone: '123',
  recordNumber: `L-${id}`,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  currentSection: { year: 2026, grade: 3, division: 'A', shift: 'MORNING' },
  guardians: [],
})

// Responde como el back según la URL
function stubBack() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      let body: unknown = []
      if (url.includes('/api/subject-repeats/options')) {
        body = { success: true, data: { activeCycle: { id: 'y', year: 2026 }, options: [] } }
      } else if (url.includes('/api/subject-repeats')) {
        body = { success: true, data: [], message: '' }
      } else if (url.includes('/api/students/s1')) body = student('s1', 'Mateo')
      else if (url.includes('/api/students/s2')) body = student('s2', 'Sofía')
      return { ok: true, status: 200, json: async () => body }
    })
  )
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

// Al cambiar de alumno no tiene que quedar abierto un diálogo del anterior. Hoy ya pasa porque la
// ficha muestra el esqueleto mientras carga al nuevo; además la pestaña lleva key={student.id}
describe('pestaña Recursados al cambiar de alumno (CRM-082)', () => {
  it('se reinicia: el diálogo abierto del alumno anterior se cierra', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    stubBack()
    const router = createMemoryRouter(
      [{ path: '/students/:id', element: <StudentProfilePage /> }],
      { initialEntries: ['/students/s1'] }
    )
    render(withNotifications(<RouterProvider router={router} />))

    fireEvent.click(await screen.findByRole('tab', { name: 'Recursados' }))
    fireEvent.click(await screen.findByRole('button', { name: /asignar recursado/i }))
    expect(await screen.findByText(/Asignar recursado · García, Mateo/)).toBeTruthy()

    await act(() => router.navigate('/students/s2'))
    await screen.findAllByText(/García, Sofía/)
    expect(screen.queryByText(/Asignar recursado · García, Mateo/)).toBeNull()
  })
})
