// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { Aside } from '@/components/layout/Aside'

// Ítem "Derivados al EDTE" del menú (CRM-074, criterio 5)

const renderAs = (role: string) => {
  sessionStorage.setItem('token', `x.${btoa(JSON.stringify({ role }))}.y`)
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

describe('menú: Derivados al EDTE', () => {
  it.each(['EOE_DIRECTIVE', 'SCHOOL_MANAGEMENT'])('lo ve %s', (role) => {
    renderAs(role)
    expect(screen.getByText('Derivados al EDTE')).toBeTruthy()
  })

  it.each(['ADMINISTRATOR', 'TEACHER', 'PRECEPTOR'])('no lo ve %s', (role) => {
    renderAs(role)
    expect(screen.queryByText('Derivados al EDTE')).toBeNull()
  })
})
