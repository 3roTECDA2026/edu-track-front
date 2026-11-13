// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { Aside } from '@/components/layout/Aside'
import { loginAs } from '@/test/edteTestUtils'

const renderMenu = (role: string | null) => {
  loginAs(role)
  render(
    <MemoryRouter>
      <Aside />
    </MemoryRouter>
  )
}

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})

// El ítem "Reuniones del EDTE" del menú sale solo para el personal que puede verlas (mismos roles
// que permite el back); el menú solo oculta, los permisos reales los valida el back
describe('menú: Reuniones del EDTE', () => {
  it.each(['ADMINISTRATOR', 'SCHOOL_MANAGEMENT', 'EOE_DIRECTIVE', 'TEACHER', 'PRECEPTOR'])(
    'lo ve %s',
    (role) => {
      renderMenu(role)
      expect(screen.getByText('Reuniones del EDTE')).toBeTruthy()
    }
  )

  it.each(['STUDENT', 'FAMILY', null])('no lo ve %s', (role) => {
    renderMenu(role)
    // El resto del menú sí está, así que no es que el menú no haya cargado
    expect(screen.getByText('Estudiantes')).toBeTruthy()
    expect(screen.queryByText('Reuniones del EDTE')).toBeNull()
  })
})

describe('menú: Integrantes del EDTE', () => {
  it.each(['ADMINISTRATOR', 'SCHOOL_MANAGEMENT', 'EOE_DIRECTIVE'])('lo ve %s', (role) => {
    renderMenu(role)
    expect(screen.getByText('Integrantes EDTE')).toBeTruthy()
  })

  it.each(['TEACHER', 'PRECEPTOR', 'STUDENT', 'FAMILY', null])('no lo ve %s', (role) => {
    renderMenu(role)
    expect(screen.getByText('Estudiantes')).toBeTruthy()
    expect(screen.queryByText('Integrantes EDTE')).toBeNull()
  })
})
