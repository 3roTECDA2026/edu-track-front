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
