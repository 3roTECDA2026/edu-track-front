// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EdteMeetingDetailPage } from '@/pages/EdteMeetingDetailPage'
import { detail, loginAs, stubApi, withNotifications } from '@/test/edteTestUtils'

vi.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const renderDetail = (meeting: ReturnType<typeof detail>) => {
  stubApi([[() => true, meeting]])
  return render(
    withNotifications(
      <MemoryRouter initialEntries={['/edte-meetings/m1']}>
        <Routes>
          <Route path="/edte-meetings/:id" element={<EdteMeetingDetailPage />} />
        </Routes>
      </MemoryRouter>
    )
  )
}

const signButton = () =>
  screen.queryByRole('button', { name: /marcar como firmada/i }) as HTMLButtonElement | null

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

describe('detalle de una reunión del EDTE', () => {
  describe('marcar como firmada', () => {
    it('sin enlace al acta, el botón está bloqueado y explica por qué', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      renderDetail(detail({ minutesUrl: null }))
      await screen.findByText('Borrador')
      expect(signButton()?.disabled).toBe(true)
      expect(screen.getByText(/cargá primero un enlace válido al acta/i)).toBeTruthy()
    })

    it('con un enlace que no es una dirección web, también está bloqueado', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      renderDetail(detail({ minutesUrl: 'javascript:alert(1)' }))
      await screen.findByText('Borrador')
      expect(signButton()?.disabled).toBe(true)
      // Y el enlace no se muestra como un link para hacer clic
      expect(screen.queryByRole('link', { name: /ver acta/i })).toBeNull()
      expect(screen.getByText(/enlace no válido/i)).toBeTruthy()
    })

    it('con una reunión futura, está bloqueado aunque tenga acta', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      renderDetail(detail({ date: '2999-03-02', minutesUrl: 'https://acta.example.com' }))
      await screen.findByText('Borrador')
      expect(signButton()?.disabled).toBe(true)
      expect(screen.getByText(/todavía no ocurrió/i)).toBeTruthy()
    })

    it('con acta válida y la reunión ya ocurrida, se puede marcar como firmada', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      renderDetail(detail({ minutesUrl: 'https://acta.example.com/acta.pdf' }))
      await screen.findByText('Borrador')
      expect(signButton()?.disabled).toBe(false)
      expect(screen.getByRole('link', { name: /ver acta/i })).toBeTruthy()
    })
  })

  describe('acciones según el rol y el estado', () => {
    it.each(['TEACHER', 'PRECEPTOR'])('%s no ve editar ni firmar', async (role) => {
      loginAs(role)
      renderDetail(detail({ minutesUrl: 'https://acta.example.com' }))
      await screen.findByText('Borrador')
      expect(signButton()).toBeNull()
      expect(screen.queryByRole('button', { name: /^editar$/i })).toBeNull()
    })

    it('una reunión ya firmada no ofrece editar ni firmar', async () => {
      loginAs('SCHOOL_MANAGEMENT')
      renderDetail(
        detail({
          status: 'SIGNED',
          minutesUrl: 'https://acta.example.com',
          signedAt: '2026-03-05T12:00:00.000Z',
          signedBy: { id: 'u1', name: 'Quiroga, Marcela' },
        })
      )
      // "Firmada" aparece dos veces (estado y fecha de firma): se espera a que cargue la reunión
      await screen.findByText('García, Mateo')
      expect(signButton()).toBeNull()
      expect(screen.queryByRole('button', { name: /^editar$/i })).toBeNull()
    })

    it('quienes gestionan ven editar y firmar en un borrador', async () => {
      loginAs('EOE_DIRECTIVE')
      renderDetail(detail({ minutesUrl: 'https://acta.example.com' }))
      await screen.findByText('Borrador')
      expect(signButton()).toBeTruthy()
      expect(screen.getByRole('button', { name: /^editar$/i })).toBeTruthy()
    })
  })
})
