import { vi } from 'vitest'

import type { EdteDashboard } from '@/services/edteDashboard.service'

// Ayudas para las pruebas del dashboard del EDTE (CRM-077). La rama de CRM-075 tiene otras
// parecidas (`edteTestUtils.tsx`): cuando las dos estén en develop, conviene unificarlas.

// Inicia sesión como un usuario con ese rol (el token solo lleva el rol, como lo lee la app)
export function loginAs(role: string | null) {
  sessionStorage.clear()
  localStorage.clear()
  if (role)
    sessionStorage.setItem('token', `x.${btoa(JSON.stringify({ role })).replace(/=/g, '')}.y`)
}

// Responde a los pedidos de la app según la URL: la primera ruta que coincida gana. Devuelve el
// mock de fetch para poder revisar con qué parámetros se pidió.
export function stubApi(routes: Array<[test: (url: string) => boolean, body: unknown]>) {
  const fetchMock = vi.fn(async (url: string) => {
    const route = routes.find(([test]) => test(url))
    return { ok: true, status: 200, json: async () => (route ? route[1] : []) }
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export const dashboard = (overrides: Partial<EdteDashboard> = {}): EdteDashboard => ({
  academicYear: 2026,
  term: 'FIRST',
  thresholds: { earlyWarningPending: 4, referredPending: 5, mediumTedCount: 1, highTedCount: 2 },
  indicators: {
    totalStudents: 14,
    studentsByAssessment: { TEA: 3, TEP: 1, TED: 2, NONE: 8 },
    earlyWarning: 1,
    referred: 1,
    tedAssessments: 3,
  },
  students: [
    {
      id: 's1',
      firstName: 'Sofía',
      lastName: 'Díaz',
      dni: '50000004',
      section: { id: 'c1', grade: 1, division: 'A', shift: 'MORNING' },
      assessment: 'TED',
      tedCount: 2,
      pendingSubjectsCount: 0,
      level: 'HIGH',
      pate: null,
    },
    {
      id: 's2',
      firstName: 'Lucía',
      lastName: 'Castro',
      dni: '50000003',
      section: { id: 'c1', grade: 1, division: 'A', shift: 'MORNING' },
      assessment: 'TEA',
      tedCount: 0,
      pendingSubjectsCount: 4,
      level: 'MEDIUM',
      pate: { id: 'p1', status: 'IN_PROGRESS' },
    },
    {
      id: 's3',
      firstName: 'Ana',
      lastName: 'Pérez',
      dni: '50000009',
      section: { id: 'c1', grade: 1, division: 'A', shift: 'MORNING' },
      assessment: 'TEA',
      tedCount: 0,
      pendingSubjectsCount: 0,
      level: 'LOW',
      pate: { id: 'p2', status: 'IN_PROGRESS' },
    },
  ],
  ...overrides,
})
