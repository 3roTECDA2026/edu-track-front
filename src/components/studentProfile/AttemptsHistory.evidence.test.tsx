// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AttemptsHistory } from '@/components/studentProfile/AttemptsHistory'
import { loginAs, stubApi, withNotifications } from '@/test/edteTestUtils'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const attempt = (id: string, attachmentsCount: number) => ({
  id,
  period: 'DECEMBER',
  cycleYear: 2025,
  startDate: '2025-12-01T00:00:00.000Z',
  endDate: '2025-12-12T00:00:00.000Z',
  model: 'MODEL_1',
  resultCode: 'CCA',
  score: 2,
  attachmentsCount,
})

const evidence = {
  id: 'a1',
  intensificationId: 'con',
  originalName: 'evaluacion.pdf',
  mimeType: 'application/pdf',
  size: 4096,
  createdAt: '2025-12-10T12:00:00.000Z',
  uploadedBy: { id: 'u1', firstName: 'Ana', lastName: 'Pérez' },
}

function renderHistory(role: string) {
  loginAs(role)
  const fetchMock = stubApi([
    [(url) => url.includes('/attempts'), { data: [attempt('con', 2), attempt('sin', 0)] }],
    [(url) => url.includes('/intensifications/con/attachments'), [evidence]],
  ])
  render(withNotifications(<AttemptsHistory pendingSubjectId="p1" />))
  fireEvent.click(screen.getByRole('button', { name: /historial de intentos/i }))
  return fetchMock
}

describe('evidencias en el historial de intentos (CRM-060)', () => {
  it('muestra cuántas evidencias tiene cada intento y las pide recién al abrirlas', async () => {
    const fetchMock = renderHistory('TEACHER')

    expect(await screen.findByRole('button', { name: 'Ver evidencias (2)' })).toBeTruthy()
    expect(screen.getByText('Sin evidencias')).toBeTruthy()
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/attachments'))).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Ver evidencias (2)' }))

    expect(await screen.findByText('evaluacion.pdf')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ver evaluacion.pdf' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Descargar evaluacion.pdf' })).toBeTruthy()
    // Un docente no puede quitar evidencias
    expect(screen.queryByRole('button', { name: 'Quitar evaluacion.pdf' })).toBeNull()
  })

  it('dirección puede quitar una evidencia, con confirmación', async () => {
    renderHistory('SCHOOL_MANAGEMENT')

    fireEvent.click(await screen.findByRole('button', { name: 'Ver evidencias (2)' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Quitar evaluacion.pdf' }))

    expect(await screen.findByText('¿Quitar "evaluacion.pdf"?')).toBeTruthy()
    expect(screen.getByText(/queda registrado quién lo quitó/i)).toBeTruthy()
  })
})
