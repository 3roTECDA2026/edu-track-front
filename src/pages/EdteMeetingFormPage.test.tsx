// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EdteMeetingFormPage } from '@/pages/EdteMeetingFormPage'
import { detail, loginAs, stubApi, withNotifications } from '@/test/edteTestUtils'

vi.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const memberOptions = [
  { userId: 'u1', name: 'Quiroga, Marcela', role: 'SCHOOL_MANAGEMENT' },
  { userId: 'u2', name: 'Méndez, Carla', role: 'TEACHER' },
]

// Respuestas del back para las pantallas de alta y edición
const api = (meeting?: ReturnType<typeof detail>) =>
  stubApi([
    [(url) => url.includes('/member-options'), memberOptions],
    [(url) => url.includes('/candidates'), []],
    [(url) => /\/api\/edte-meetings\/[^/?]+$/.test(url), meeting ?? detail()],
  ])

const renderAt = (path: string) =>
  render(
    withNotifications(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/edte-meetings/new" element={<EdteMeetingFormPage />} />
          <Route path="/edte-meetings/:id/edit" element={<EdteMeetingFormPage />} />
          <Route path="/edte-meetings/:id" element={<p>DETALLE</p>} />
        </Routes>
      </MemoryRouter>
    )
  )

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  sessionStorage.clear()
})

describe('formulario de reunión del EDTE', () => {
  describe('edición de una reunión firmada', () => {
    it('no muestra el formulario: avisa que ya está firmada', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      api(
        detail({
          status: 'SIGNED',
          minutesUrl: 'https://acta.example.com',
          signedAt: '2026-03-05T12:00:00.000Z',
        })
      )
      renderAt('/edte-meetings/m1/edit')

      expect(
        await screen.findByText(/la reunión ya está firmada: no se puede editar/i)
      ).toBeTruthy()
      // Ningún campo ni botón de guardado: el formulario ni se monta
      expect(screen.queryByLabelText(/fecha/i)).toBeNull()
      expect(screen.queryByRole('button', { name: /guardar/i })).toBeNull()
      expect(screen.getByRole('button', { name: /ver la reunión/i })).toBeTruthy()
    })

    it('si falla la carga, avisa y no muestra el formulario', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: false,
          status: 404,
          statusText: 'No encontrada',
          json: async () => ({ error: 'Reunión del EDTE no encontrada' }),
        }))
      )
      renderAt('/edte-meetings/m1/edit')
      expect(await screen.findByText(/no se pudo cargar la reunión/i)).toBeTruthy()
      expect(screen.queryByRole('button', { name: /guardar/i })).toBeNull()
    })
  })

  describe('edición de un borrador', () => {
    it('carga los datos de la reunión en el formulario', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      api()
      renderAt('/edte-meetings/m1/edit')

      expect(await screen.findByDisplayValue('2026-03-02')).toBeTruthy()
      expect(screen.getByDisplayValue('Acuerdos de la reunión')).toBeTruthy()
      // Los convocados quedan tildados y solo la presente está marcada como presente
      expect(
        (await screen.findByLabelText('Convocar a Quiroga, Marcela')) as HTMLInputElement
      ).toHaveProperty('checked', true)
      expect(screen.getByLabelText('Quiroga, Marcela estuvo presente')).toHaveProperty(
        'checked',
        true
      )
      expect(screen.getByLabelText('Méndez, Carla estuvo presente')).toHaveProperty(
        'checked',
        false
      )
      // El alumno tratado ya está elegido
      expect(screen.getByText('García, Mateo (DNI 46222333)')).toBeTruthy()
    })

    it('no actualiza estado durante el render ni deja avisos de React', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      api()
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
      renderAt('/edte-meetings/m1/edit')
      await screen.findByDisplayValue('2026-03-02')
      await screen.findByLabelText('Convocar a Quiroga, Marcela')
      const reactWarnings = errors.mock.calls
        .map((call) => String(call[0]))
        .filter((message) =>
          /while rendering|Maximum update depth|Cannot update a component/i.test(message)
        )
      expect(reactWarnings).toEqual([])
    })

    it('el botón Guardar es un submit nativo del formulario', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      api()
      renderAt('/edte-meetings/m1/edit')
      const save = await screen.findByRole('button', { name: /^guardar$/i })
      expect(save.getAttribute('type')).toBe('submit')
      expect(save.closest('form')).toBeTruthy()
    })
  })

  describe('reunión nueva', () => {
    it('un borrador incompleto se puede guardar, pero avisa qué falta', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      api()
      renderAt('/edte-meetings/new')
      expect(await screen.findByText(/todavía no hay integrantes convocados/i)).toBeTruthy()
      expect(screen.getByText(/todavía no hay alumnos tratados/i)).toBeTruthy()
      const save = screen.getByRole('button', { name: /^guardar$/i })
      expect((save as HTMLButtonElement).disabled).toBe(false)
    })

    it('muestra la regla de fecha del período elegido', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      api()
      renderAt('/edte-meetings/new')
      expect(await screen.findByText(/entre el 1 de febrero y el 31 de marzo de/i)).toBeTruthy()
    })
  })
})

// Alumno que llega con ?studentId= desde "Agregar a reunión" de la pantalla de derivados (CRM-074)
describe('alumno para sumar de entrada (CRM-074)', () => {
  const student = {
    id: 's9',
    firstName: 'Ana',
    lastName: 'Pérez',
    dni: '40111222',
    currentSection: { year: 2026, grade: 2, division: 'B', shift: 'AFTERNOON' },
  }

  const apiWithStudent = (meeting?: ReturnType<typeof detail>) =>
    stubApi([
      [(url) => url.includes('/member-options'), memberOptions],
      [(url) => url.includes('/candidates'), []],
      [(url) => url.includes('/api/students/'), student],
      [(url) => /\/api\/edte-meetings\/[^/?]+$/.test(url), meeting ?? detail()],
    ])

  it('en una reunión nueva, el alumno ya figura entre los tratados', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    apiWithStudent()
    renderAt('/edte-meetings/new?studentId=s9')
    expect((await screen.findAllByText(/Pérez, Ana \(DNI 40111222\)/)).length).toBeGreaterThan(0)
  })

  it('si el alumno ya está en la reunión, no se repite', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    api()
    renderAt('/edte-meetings/m1/edit')
    const withoutParam = (await screen.findAllByText(/García, Mateo \(DNI 46222333\)/)).length
    cleanup()

    stubApi([
      [(url) => url.includes('/member-options'), memberOptions],
      [(url) => url.includes('/candidates'), []],
      [
        (url) => url.includes('/api/students/'),
        { ...student, id: 's1', firstName: 'Mateo', lastName: 'García', dni: '46222333' },
      ],
      [(url) => /\/api\/edte-meetings\/[^/?]+$/.test(url), detail()],
    ])
    renderAt('/edte-meetings/m1/edit?studentId=s1')
    expect((await screen.findAllByText(/García, Mateo \(DNI 46222333\)/)).length).toBe(withoutParam)
  })

  it('si no se puede cargar el alumno, avisa y abre el formulario igual', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/api/students/')) {
          return {
            ok: false,
            status: 404,
            json: async () => ({ error: 'Estudiante no encontrado' }),
          }
        }
        const body = url.includes('/member-options') ? memberOptions : []
        return { ok: true, status: 200, json: async () => body }
      })
    )
    renderAt('/edte-meetings/new?studentId=nope')
    expect(await screen.findByText(/no se pudo cargar el alumno para sumarlo/i)).toBeTruthy()
    expect(await screen.findByRole('button', { name: /guardar/i })).toBeTruthy()
  })
})
