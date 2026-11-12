// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import StudentProfilePage from '@/pages/StudentProfilePage'
import type { PendingSubject } from '@/services/pendingSubject.service'
import type { StudentDetail } from '@/services/students.service'
import { loginAs, withNotifications } from '@/test/edteTestUtils'

// El layout (menú, encabezado) no es lo que se prueba
vi.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const student: StudentDetail = {
  id: 's1',
  dni: '40111222',
  firstName: 'Mateo',
  lastName: 'García',
  dateOfBirth: '2010-05-01',
  placeOfBirth: 'Tandil',
  address: 'Calle 1',
  city: 'Tandil',
  phone: '123',
  recordNumber: 'L-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  currentSection: { year: 2026, grade: 3, division: 'A', shift: 'MORNING' },
  guardians: [],
}

// Matemática es de 1.º año, pero la cursó en 2.º: el back informa gradeLevel 2
const mpaa = (overrides: Partial<PendingSubject> = {}): PendingSubject => ({
  id: 'p-mat',
  status: 'PENDING',
  initialPendingKnowledge: 'Fracciones',
  closingPendingKnowledge: null,
  finalScore: null,
  accreditedAt: null,
  updatedAt: '2026-03-01T00:00:00.000Z',
  subject: { id: 'mat', name: 'Matemática', gradeLevel: 1 },
  originAcademicYear: { id: 'y2025', year: 2025 },
  gradeLevel: 2,
  ...overrides,
})

// Responde como el back según la URL y guarda los pedidos
function stubBack(pendings: PendingSubject[] = [mpaa()]) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    let body: unknown = []
    if (url.includes('/api/pending-subjects')) {
      body = { success: true, data: method === 'PATCH' ? pendings[0] : pendings, message: '' }
    } else if (url.includes('/api/students/')) body = student
    else if (url.includes('/api/grades')) body = { data: [], total: 0, page: 1, totalPages: 0 }
    return { ok: true, status: 200, json: async () => body }
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const renderProfile = () =>
  render(
    withNotifications(
      <MemoryRouter initialEntries={['/students/s1']}>
        <Routes>
          <Route path="/students/:id" element={<StudentProfilePage />} />
        </Routes>
      </MemoryRouter>
    )
  )

// Abre "Materias pendientes" y espera a que cargue la tarjeta de Matemática
async function openPendingTab() {
  fireEvent.click(await screen.findByRole('tab', { name: 'Materias pendientes' }))
  await screen.findByText('Matemática')
}

const initialField = () =>
  screen.getByRole('textbox', { name: 'Saberes pendientes al inicio del ciclo' })

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

describe('pestaña "Materias pendientes" (CRM-097)', () => {
  it('muestra el año de la cursada de origen, no el de la materia', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    stubBack()
    renderProfile()
    await openPendingTab()
    expect(screen.getByText(/2° año · Quedó pendiente en el ciclo/)).toBeTruthy()
    expect(screen.queryByText(/1° año/)).toBeNull()
  })

  it('con un back sin el campo nuevo, usa el año de la materia', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    stubBack([mpaa({ gradeLevel: undefined })])
    renderProfile()
    await openPendingTab()
    expect(screen.getByText(/1° año · Quedó pendiente en el ciclo/)).toBeTruthy()
  })

  it('el estado se muestra con texto, sin los colores ámbar y verde', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    stubBack([
      mpaa(),
      mpaa({
        id: 'p-bio',
        status: 'ACCREDITED',
        subject: { id: 'bio', name: 'Biología', gradeLevel: 2 },
      }),
    ])
    renderProfile()
    await openPendingTab()
    const pending = screen.getByText('Pendiente').closest('.MuiChip-root') as HTMLElement
    const accredited = screen.getByText('Acreditada').closest('.MuiChip-root') as HTMLElement
    expect(pending.querySelector('svg')).toBeTruthy()
    expect(accredited.querySelector('svg')).toBeTruthy()
    for (const chip of [pending, accredited]) {
      const style = getComputedStyle(chip)
      expect(`${style.color} ${style.backgroundColor}`).not.toMatch(
        /146, 64, 14|254, 243, 199|21, 128, 61|220, 252, 231/
      )
    }
  })

  it('guardar manda solo el campo que cambió', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    const fetchMock = stubBack()
    renderProfile()
    await openPendingTab()
    fireEvent.change(initialField(), { target: { value: 'Fracciones y decimales' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(true)
    )
    const [url, init] = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH')!
    expect(url).toContain('/api/pending-subjects/p-mat')
    expect(JSON.parse(String(init?.body))).toEqual({
      initialPendingKnowledge: 'Fracciones y decimales',
    })
  })
})

describe('aviso de cambios sin guardar (CRM-097)', () => {
  it('sin cambios, cambiar de pestaña no muestra ningún aviso', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    stubBack()
    renderProfile()
    await openPendingTab()
    fireEvent.click(screen.getByRole('tab', { name: 'Calificaciones' }))
    expect(screen.queryByText('Tenés cambios sin guardar')).toBeNull()
    expect(screen.queryByText('Matemática')).toBeNull()
  })

  it('con cambios, avisa y no cambia de pestaña', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    stubBack()
    renderProfile()
    await openPendingTab()
    fireEvent.change(initialField(), { target: { value: 'Otro texto' } })
    fireEvent.click(screen.getByRole('tab', { name: 'Calificaciones' }))
    expect(await screen.findByText('Tenés cambios sin guardar')).toBeTruthy()
    expect(screen.getByText('Matemática')).toBeTruthy()
  })

  it('"Seguir editando" se queda en la pestaña con el texto escrito', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    stubBack()
    renderProfile()
    await openPendingTab()
    fireEvent.change(initialField(), { target: { value: 'Otro texto' } })
    fireEvent.click(screen.getByRole('tab', { name: 'Calificaciones' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Seguir editando' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect((initialField() as HTMLTextAreaElement).value).toBe('Otro texto')
  })

  it('"Salir sin guardar" cambia de pestaña y al volver está lo guardado', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    stubBack()
    renderProfile()
    await openPendingTab()
    fireEvent.change(initialField(), { target: { value: 'Otro texto' } })
    fireEvent.click(screen.getByRole('tab', { name: 'Calificaciones' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salir sin guardar' }))
    await waitFor(() => expect(screen.queryByText('Matemática')).toBeNull())

    await openPendingTab()
    expect((initialField() as HTMLTextAreaElement).value).toBe('Fracciones')
    // Ya no quedan cambios: se puede salir sin aviso
    fireEvent.click(screen.getByRole('tab', { name: 'Calificaciones' }))
    expect(screen.queryByText('Tenés cambios sin guardar')).toBeNull()
  })

  it('después de descartar, cambiar de pestaña no avisa', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    stubBack()
    renderProfile()
    await openPendingTab()
    fireEvent.change(initialField(), { target: { value: 'Otro texto' } })
    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Calificaciones' }))
    expect(screen.queryByText('Tenés cambios sin guardar')).toBeNull()
    expect(screen.queryByText('Matemática')).toBeNull()
  })
})
