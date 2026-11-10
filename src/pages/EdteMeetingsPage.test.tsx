// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EdteMeetingsPage } from '@/pages/EdteMeetingsPage'
import { loginAs, stubApi, summary, withNotifications } from '@/test/edteTestUtils'

// El layout (menú, encabezado) no es lo que se prueba: se reemplaza por un contenedor simple
vi.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const renderPage = () =>
  render(
    withNotifications(
      <MemoryRouter>
        <EdteMeetingsPage />
      </MemoryRouter>
    )
  )

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

describe('listado de reuniones del EDTE', () => {
  describe('botón "Nueva reunión"', () => {
    it.each(['ADMINISTRATOR', 'SCHOOL_MANAGEMENT', 'EOE_DIRECTIVE'])('lo ve %s', async (role) => {
      loginAs(role)
      stubApi([[() => true, []]])
      renderPage()
      expect(await screen.findByRole('button', { name: /nueva reunión/i })).toBeTruthy()
    })

    it.each(['TEACHER', 'PRECEPTOR'])('no lo ve %s', async (role) => {
      loginAs(role)
      stubApi([[() => true, [summary()]]])
      renderPage()
      // Espera a que cargue el listado para no confirmar la ausencia antes de tiempo
      await screen.findByText('02/03/2026')
      expect(screen.queryByRole('button', { name: /nueva reunión/i })).toBeNull()
    })
  })

  describe('carga', () => {
    it('sin reuniones muestra el mensaje de vacío', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      stubApi([[() => true, []]])
      renderPage()
      expect(
        await screen.findByText(/no hay reuniones registradas para estos filtros/i)
      ).toBeTruthy()
    })

    it('con reuniones las lista con su período, estado y alumnos tratados', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      stubApi([[() => true, [summary()]]])
      renderPage()
      expect(await screen.findByText('02/03/2026')).toBeTruthy()
      expect(screen.getByText('Borrador')).toBeTruthy()
      expect(screen.getByText('2 de 3')).toBeTruthy()
    })

    it('si falla el pedido, avisa y ofrece reintentar', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: false,
          status: 500,
          statusText: 'Error',
          json: async () => ({ error: 'Internal server error' }),
        }))
      )
      renderPage()
      expect(await screen.findByText(/no se pudieron cargar las reuniones/i)).toBeTruthy()
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeTruthy()
    })
  })

  describe('filtros', () => {
    it('al elegir un período pide el listado filtrado y, si no hay resultados, muestra el vacío', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      const fetchMock = stubApi([
        [(url) => url.includes('period=AUGUST'), []],
        [() => true, [summary()]],
      ])
      renderPage()
      await screen.findByText('02/03/2026')

      fireEvent.mouseDown(screen.getByRole('combobox', { name: /período/i }))
      fireEvent.click(await screen.findByRole('option', { name: 'Agosto' }))

      expect(
        await screen.findByText(/no hay reuniones registradas para estos filtros/i)
      ).toBeTruthy()
      await waitFor(() =>
        expect(fetchMock.mock.calls.some(([url]) => String(url).includes('period=AUGUST'))).toBe(
          true
        )
      )
      // El filtro de ciclo viaja siempre
      expect(String(fetchMock.mock.calls[fetchMock.mock.calls.length - 1]?.[0])).toContain('year=')
    })
  })
})
