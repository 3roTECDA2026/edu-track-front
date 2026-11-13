// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InterventionAttachments } from '@/components/interventions/InterventionAttachments'
import { stubApi, withNotifications } from '@/test/edteTestUtils'

const attachment = {
  id: 'a1',
  interventionId: 'i1',
  originalName: 'acta.pdf',
  mimeType: 'application/pdf',
  size: 2048,
  createdAt: '2026-11-13T12:00:00.000Z',
  uploadedBy: { id: 'u1', firstName: 'Ana', lastName: 'Pérez' },
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('adjuntos de una intervención (CRM-087)', () => {
  it('no pide nada al back hasta tocar "Ver adjuntos"', async () => {
    const fetchMock = stubApi([[(url) => url.includes('/attachments'), { data: [attachment] }]])
    render(withNotifications(<InterventionAttachments interventionId="i1" />))

    // Al abrir la pestaña no se hace ningún pedido
    expect(fetchMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /ver adjuntos/i }))

    // Al tocar el botón, pide la lista una sola vez y la muestra
    expect(await screen.findByText('acta.pdf')).toBeTruthy()
    expect(screen.getByText('2 KB')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/interventions/i1/attachments')
  })

  it('si la intervención no tiene adjuntos, lo dice', async () => {
    stubApi([[(url) => url.includes('/attachments'), { data: [] }]])
    render(withNotifications(<InterventionAttachments interventionId="i1" />))

    fireEvent.click(screen.getByRole('button', { name: /ver adjuntos/i }))

    expect(await screen.findByText(/no tiene adjuntos/i)).toBeTruthy()
  })
})
