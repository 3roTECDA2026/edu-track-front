// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EdteMeetingDetailPage } from '@/pages/EdteMeetingDetailPage'
import type { EdteMeetingMember } from '@/services/edteMeeting.service'
import { detail, loginAs, stubApi, withNotifications } from '@/test/edteTestUtils'
import { saveBlob } from '@/utils/saveBlob'

vi.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// La descarga real del archivo no se prueba acá: alcanza con ver qué se pidió guardar
vi.mock('@/utils/saveBlob', () => ({ saveBlob: vi.fn() }))

const renderDetail = (meeting: ReturnType<typeof detail>) => {
  const fetchMock = stubApi([[() => true, meeting]])
  render(
    withNotifications(
      <MemoryRouter initialEntries={['/edte-meetings/m1']}>
        <Routes>
          <Route path="/edte-meetings/:id" element={<EdteMeetingDetailPage />} />
        </Routes>
      </MemoryRouter>
    )
  )
  return fetchMock
}

const member = (overrides: Partial<EdteMeetingMember>): EdteMeetingMember => ({
  userId: 'u3',
  name: 'Sosa, Laura',
  role: 'TEACHER',
  roleInMeeting: 'TEACHER',
  present: true,
  signedAt: null,
  ...overrides,
})

const signButton = () =>
  screen.queryByRole('button', { name: /firmar acta/i }) as HTMLButtonElement | null
const editButton = () => screen.queryByRole('button', { name: /^editar$/i })
const downloadButton = () => screen.queryByRole('button', { name: /descargar acta/i })

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('detalle de una reunión del EDTE', () => {
  describe('firma del acta (CRM-076)', () => {
    it('un integrante presente que todavía no firmó puede firmar', async () => {
      loginAs('SCHOOL_MANAGEMENT', 'u1')
      renderDetail(detail())
      await screen.findByText('Borrador')
      expect(signButton()?.disabled).toBe(false)
    })

    it('un docente presente también firma, aunque no pueda editar la reunión', async () => {
      loginAs('TEACHER', 'u3')
      renderDetail(detail({ members: [member({})] }))
      await screen.findByText('Borrador')
      expect(signButton()?.disabled).toBe(false)
      expect(editButton()).toBeNull()
    })

    it('quien estuvo ausente no puede firmar', async () => {
      loginAs('TEACHER', 'u2')
      renderDetail(detail())
      await screen.findByText('Borrador')
      expect(signButton()).toBeNull()
    })

    it('quien no fue convocado no firma, aunque gestione las reuniones', async () => {
      loginAs('EOE_DIRECTIVE', 'u9')
      renderDetail(detail())
      await screen.findByText('Borrador')
      expect(signButton()).toBeNull()
      expect(editButton()).toBeTruthy()
    })

    it('quien ya firmó no vuelve a firmar y ve cuándo lo hizo', async () => {
      loginAs('SCHOOL_MANAGEMENT', 'u1')
      renderDetail(
        detail({
          members: [
            member({
              userId: 'u1',
              name: 'Quiroga, Marcela',
              role: 'SCHOOL_MANAGEMENT',
              roleInMeeting: 'SCHOOL_MANAGEMENT',
              signedAt: '2026-03-12T17:30:00.000Z',
            }),
            member({}),
          ],
        })
      )
      await screen.findByText('Borrador')
      expect(signButton()).toBeNull()
      expect(screen.getByText('Firmó el 12/03/2026 14:30')).toBeTruthy()
      expect(screen.getByText('Pendiente')).toBeTruthy()
    })

    it('con una reunión futura, firmar está bloqueado y explica por qué', async () => {
      loginAs('SCHOOL_MANAGEMENT', 'u1')
      renderDetail(detail({ date: '2999-03-02' }))
      await screen.findByText('Borrador')
      expect(signButton()?.disabled).toBe(true)
      expect(screen.getByText(/todavía no ocurrió/i)).toBeTruthy()
    })

    it('si ya hay firmas, quien gestiona ve que editar las borra', async () => {
      loginAs('EOE_DIRECTIVE', 'u9')
      renderDetail(
        detail({
          members: [member({ userId: 'u1', signedAt: '2026-03-12T17:30:00.000Z' }), member({})],
        })
      )
      await screen.findByText('Borrador')
      expect(screen.getByText(/esas firmas se borran/i)).toBeTruthy()
    })
  })

  describe('acta en PDF (CRM-076)', () => {
    it('quien gestiona las reuniones puede descargar el acta aunque no haya sido convocado', async () => {
      loginAs('SCHOOL_MANAGEMENT', 'u9')
      renderDetail(detail())
      await screen.findByText('Borrador')
      expect(downloadButton()).toBeTruthy()
    })

    it('un integrante convocado puede descargar el acta, aunque haya estado ausente', async () => {
      loginAs('TEACHER', 'u2')
      renderDetail(detail())
      await screen.findByText('Borrador')
      expect(downloadButton()).toBeTruthy()
    })

    it.each(['TEACHER', 'PRECEPTOR'])(
      '%s que no fue convocado no ve descargar el acta',
      async (role) => {
        loginAs(role, 'u9')
        renderDetail(detail())
        await screen.findByText('Borrador')
        expect(downloadButton()).toBeNull()
      }
    )

    it('la descarga pide el acta al back y la guarda con la fecha de la reunión', async () => {
      loginAs('TEACHER', 'u2')
      const fetchMock = renderDetail(detail())
      await screen.findByText('Borrador')
      fireEvent.click(downloadButton() as HTMLElement)
      await waitFor(() =>
        expect(saveBlob).toHaveBeenCalledWith(expect.any(Blob), 'acta-edte-2026-03-02.pdf')
      )
      expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/edte-meetings/m1/minutes'))).toBe(
        true
      )
    })
  })

  describe('acciones según el rol y el estado', () => {
    it.each(['TEACHER', 'PRECEPTOR'])('%s no ve editar', async (role) => {
      loginAs(role, 'u9')
      renderDetail(detail())
      await screen.findByText('Borrador')
      expect(editButton()).toBeNull()
    })

    it('una reunión ya firmada no ofrece editar ni firmar, pero sí descargar el acta', async () => {
      loginAs('SCHOOL_MANAGEMENT', 'u1')
      renderDetail(
        detail({
          status: 'SIGNED',
          minutesUrl: '/api/edte-meetings/m1/minutes',
          signedAt: '2026-03-05T12:00:00.000Z',
          signedBy: { id: 'u1', name: 'Quiroga, Marcela' },
          members: [
            member({
              userId: 'u1',
              name: 'Quiroga, Marcela',
              role: 'SCHOOL_MANAGEMENT',
              roleInMeeting: 'SCHOOL_MANAGEMENT',
              signedAt: '2026-03-05T12:00:00.000Z',
            }),
          ],
        })
      )
      // Se espera a que cargue la reunión (por uno de los alumnos tratados)
      await screen.findByText('García, Mateo')
      expect(signButton()).toBeNull()
      expect(editButton()).toBeNull()
      expect(downloadButton()).toBeTruthy()
    })

    it('un enlace al acta escaneada solo se muestra si es una dirección web', async () => {
      loginAs('SCHOOL_MANAGEMENT', 'u1')
      renderDetail(detail({ minutesUrl: 'javascript:alert(1)' }))
      await screen.findByText('Borrador')
      expect(screen.queryByRole('link', { name: /ver acta escaneada/i })).toBeNull()
    })
  })
})
