import { vi } from 'vitest'
import type { ReactNode } from 'react'

import { NotificationProvider } from '@/components/layout/NotificationProvider'
import type { EdteMeetingDetail, EdteMeetingSummary } from '@/services/edteMeeting.service'

// Ayudas para las pruebas de las pantallas del EDTE (CRM-075)

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

export const withNotifications = (children: ReactNode) => (
  <NotificationProvider>{children}</NotificationProvider>
)

export const summary = (overrides: Partial<EdteMeetingSummary> = {}): EdteMeetingSummary => ({
  id: 'm1',
  year: 2026,
  date: '2026-03-02',
  period: 'FEBRUARY_MARCH',
  shift: 'MORNING',
  status: 'DRAFT',
  minutesUrl: null,
  membersCount: 3,
  presentCount: 2,
  studentsCount: 1,
  signedAt: null,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  ...overrides,
})

export const detail = (overrides: Partial<EdteMeetingDetail> = {}): EdteMeetingDetail => ({
  ...summary(),
  considerations: 'Acuerdos de la reunión',
  createdBy: { id: 'u1', name: 'Quiroga, Marcela' },
  signedBy: null,
  members: [
    {
      userId: 'u1',
      name: 'Quiroga, Marcela',
      role: 'SCHOOL_MANAGEMENT',
      roleInMeeting: 'SCHOOL_MANAGEMENT',
      present: true,
    },
    {
      userId: 'u2',
      name: 'Méndez, Carla',
      role: 'TEACHER',
      roleInMeeting: 'TEACHER',
      present: false,
    },
  ],
  students: [
    {
      studentId: 's1',
      firstName: 'Mateo',
      lastName: 'García',
      dni: '46222333',
      section: { id: 'c1', grade: 3, division: 'A', shift: 'MORNING' },
      pendingSubjectsCount: 5,
      notes: null,
      pate: null,
    },
  ],
  ...overrides,
})
