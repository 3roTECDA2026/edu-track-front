// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'

import {
  canManageSubjectRepeats,
  repeatOrigin,
  subjectCountLabel,
  subjectLimitReached,
} from '@/components/subjectRepeats/subjectRepeatLabels'
import type { SubjectRepeat } from '@/services/subjectRepeats.service'

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

describe('origen y límite de materias del recursado (CRM-083)', () => {
  const withPate = (pateId: string | null) => ({ pateId }) as SubjectRepeat

  it('el origen es PATE si lo creó un PATE, si no Manual', () => {
    expect(repeatOrigin(withPate('pate1'))).toBe('PATE')
    expect(repeatOrigin(withPate(null))).toBe('Manual')
  })

  it('el contador se muestra como "10/12"', () => {
    expect(subjectCountLabel({ subjectCount: 10, maxSubjects: 12 })).toBe('10/12')
  })

  it('llega al límite con 12 materias (o más) en el ciclo', () => {
    expect(subjectLimitReached({ subjectCount: 11, maxSubjects: 12 })).toBe(false)
    expect(subjectLimitReached({ subjectCount: 12, maxSubjects: 12 })).toBe(true)
    expect(subjectLimitReached({ subjectCount: 13, maxSubjects: 12 })).toBe(true)
  })
})
