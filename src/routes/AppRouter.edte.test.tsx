// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AppRouter from '@/routes/AppRouter'
import { loginAs } from '@/test/edteTestUtils'

// Se prueba el router real. Las pantallas se reemplazan por un texto para ver adónde lleva cada
// ruta sin renderizar (ni pedirle datos al back) a las pantallas completas.
vi.mock('@/pages/HomePage', () => ({ default: () => <p>PANTALLA-INICIO</p> }))
vi.mock('@/pages/LoginPage', () => ({ default: () => <p>PANTALLA-LOGIN</p> }))
vi.mock('@/pages/EdteMeetingsPage', () => ({ default: () => <p>PANTALLA-LISTADO</p> }))
vi.mock('@/pages/EdteMeetingDetailPage', () => ({ default: () => <p>PANTALLA-DETALLE</p> }))
vi.mock('@/pages/EdteMeetingFormPage', () => ({ default: () => <p>PANTALLA-FORMULARIO</p> }))

function visit(path: string, role: string | null) {
  loginAs(role)
  window.history.pushState({}, '', path)
  render(<AppRouter />)
}

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})

const MANAGERS = ['ADMINISTRATOR', 'SCHOOL_MANAGEMENT', 'EOE_DIRECTIVE']
const VIEWERS_ONLY = ['TEACHER', 'PRECEPTOR']
const NO_ACCESS = ['STUDENT', 'FAMILY']

describe('acceso a las pantallas de reuniones del EDTE por rol', () => {
  it.each(['/edte-meetings', '/edte-meetings/m1', '/edte-meetings/new', '/edte-meetings/m1/edit'])(
    'sin sesión, %s lleva al login',
    (path) => {
      visit(path, null)
      expect(screen.getByText('PANTALLA-LOGIN')).toBeTruthy()
    }
  )

  describe('listado y detalle: el personal de la escuela', () => {
    it.each([...MANAGERS, ...VIEWERS_ONLY])('%s puede verlos', (role) => {
      visit('/edte-meetings', role)
      expect(screen.getByText('PANTALLA-LISTADO')).toBeTruthy()
      cleanup()
      visit('/edte-meetings/m1', role)
      expect(screen.getByText('PANTALLA-DETALLE')).toBeTruthy()
    })

    it.each(NO_ACCESS)('%s va al inicio', (role) => {
      visit('/edte-meetings', role)
      expect(screen.getByText('PANTALLA-INICIO')).toBeTruthy()
      cleanup()
      visit('/edte-meetings/m1', role)
      expect(screen.getByText('PANTALLA-INICIO')).toBeTruthy()
    })
  })

  describe('alta y edición: solo quienes gestionan', () => {
    it.each(MANAGERS)('%s puede cargar y editar', (role) => {
      visit('/edte-meetings/new', role)
      expect(screen.getByText('PANTALLA-FORMULARIO')).toBeTruthy()
      cleanup()
      visit('/edte-meetings/m1/edit', role)
      expect(screen.getByText('PANTALLA-FORMULARIO')).toBeTruthy()
    })

    it.each([...VIEWERS_ONLY, ...NO_ACCESS])('%s va al inicio', (role) => {
      visit('/edte-meetings/new', role)
      expect(screen.getByText('PANTALLA-INICIO')).toBeTruthy()
      cleanup()
      visit('/edte-meetings/m1/edit', role)
      expect(screen.getByText('PANTALLA-INICIO')).toBeTruthy()
    })
  })
})
