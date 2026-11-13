// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'

import { canManageSubjectRepeats } from '@/components/subjectRepeats/subjectRepeatLabels'

// Inicia sesión con ese rol (el token solo lleva el rol, como lo lee la app)
const loginAs = (role: string) =>
  sessionStorage.setItem('token', `x.${btoa(JSON.stringify({ role })).replace(/=/g, '')}.y`)

afterEach(() => sessionStorage.clear())

describe('quién gestiona los recursados (CRM-082)', () => {
  it.each(['ADMINISTRATOR', 'SCHOOL_MANAGEMENT', 'EOE_DIRECTIVE', 'PRECEPTOR'])(
    '%s asigna, cambia la sección y quita',
    (role) => {
      loginAs(role)
      expect(canManageSubjectRepeats()).toBe(true)
    }
  )

  it('el docente solo ve', () => {
    loginAs('TEACHER')
    expect(canManageSubjectRepeats()).toBe(false)
  })
})
