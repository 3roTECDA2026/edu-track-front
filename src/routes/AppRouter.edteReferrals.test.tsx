// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AppRouter from '@/routes/AppRouter'

// Acceso a /edte-referrals (CRM-074, criterio 5) con el router real de la app

const loginAs = (role: string) =>
  sessionStorage.setItem('token', `x.${btoa(JSON.stringify({ role }))}.y`)

const openReferrals = () => {
  window.history.pushState({}, '', '/edte-referrals')
  // El resto de las pantallas puede pedir datos: todo responde vacío
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => [] }))
  )
  render(<AppRouter />)
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

describe('ruta /edte-referrals', () => {
  it.each(['EOE_DIRECTIVE', 'SCHOOL_MANAGEMENT'])('%s entra a la pantalla', async (role) => {
    loginAs(role)
    openReferrals()
    expect(await screen.findByRole('heading', { name: 'Derivados al EDTE' })).toBeTruthy()
    expect(window.location.pathname).toBe('/edte-referrals')
  })

  it.each(['ADMINISTRATOR', 'TEACHER', 'PRECEPTOR'])('%s vuelve al inicio', async (role) => {
    loginAs(role)
    openReferrals()
    await waitFor(() => expect(window.location.pathname).toBe('/home'))
  })

  it('sin sesión va al login', async () => {
    openReferrals()
    await waitFor(() => expect(window.location.pathname).toBe('/login'))
  })
})
