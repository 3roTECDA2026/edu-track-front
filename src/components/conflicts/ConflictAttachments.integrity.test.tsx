// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ConflictAttachments from '@/components/conflicts/ConflictAttachments'
import { shortHash } from '@/components/conflicts/integrityLabels'
import type { ConflictVerification, LegalConflictDetail } from '@/services/conflicts.service'
import { loginAs, stubApi } from '@/test/edteTestUtils'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const CONFLICT_HASH = '7e370adaa828c3547e7ad644342a4340d630f602e32d6cf7105dc7951aaeb118'
const ATTACHMENT_HASH = '10d4f1241611f238d43d26581cdc898fd9fd18c03585ca70559704d67695e4b9'

const detail = (overrides: Partial<LegalConflictDetail> = {}): LegalConflictDetail => ({
  id: 'c1',
  studentId: 's1',
  conflictCode: 'CON-001',
  occurrenceDate: '2026-11-17T10:00:00.000Z',
  registeredAt: '2026-11-17T12:00:00.000Z',
  documentUuid: '556cc977-21bf-470d-81c3-ecccf24c9627',
  digitalSignHash: CONFLICT_HASH,
  detailedReport: 'Informe del conflicto',
  editLocked: true,
  attachments: [
    {
      id: 'a1',
      conflictId: 'c1',
      authorId: 'u1',
      author: { firstName: 'Ana', lastName: 'Pérez' },
      content: 'Anexo de seguimiento',
      date: '2026-11-17T13:00:00.000Z',
      documentUuid: 'b33ab5cb-d67d-4b51-8149-ddc6b952a9f2',
      digitalSignHash: ATTACHMENT_HASH,
    },
  ],
  ...overrides,
})

const verification = (overrides: Partial<ConflictVerification> = {}): ConflictVerification => ({
  conflictId: 'c1',
  documentUuid: '556cc977-21bf-470d-81c3-ecccf24c9627',
  status: 'INTACT',
  conflictStatus: 'INTACT',
  storedHash: CONFLICT_HASH,
  calculatedHash: CONFLICT_HASH,
  reasons: [],
  signature: { status: 'UNSIGNED', signedAt: null },
  attachments: [
    {
      id: 'a1',
      documentUuid: 'b33ab5cb-d67d-4b51-8149-ddc6b952a9f2',
      status: 'INTACT',
      reasons: [],
    },
  ],
  verifiedAt: '2026-11-17T14:00:00.000Z',
  ...overrides,
})

function openDetail(conflict: LegalConflictDetail, result: ConflictVerification) {
  loginAs('EOE_DIRECTIVE')
  const fetchMock = stubApi([
    [(url) => url.endsWith('/verify'), { success: true, data: result }],
    [(url) => url.includes('/api/legal-conflicts/c1'), { success: true, data: conflict }],
  ])
  render(<ConflictAttachments conflictId="c1" />)
  fireEvent.click(screen.getByRole('button', { name: 'Ver acta y anexos' }))
  return fetchMock
}

const verifyCalls = (fetchMock: ReturnType<typeof stubApi>) =>
  fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/verify')).length

describe('integridad del acta en el detalle (CRM-093)', () => {
  it('muestra el UUID y el hash del acta y de cada anexo', async () => {
    openDetail(detail(), verification())

    expect(await screen.findByText('Integridad del documento')).toBeTruthy()
    expect(screen.getByText(`UUID: ${detail().documentUuid}`)).toBeTruthy()
    expect(screen.getByText(`Hash: ${shortHash(CONFLICT_HASH)}`)).toBeTruthy()
    expect(screen.getByText(`UUID: ${detail().attachments[0]!.documentUuid}`)).toBeTruthy()
    expect(screen.getByText(`Hash: ${shortHash(ATTACHMENT_HASH)}`)).toBeTruthy()
  })

  it('un acta anterior al hash lo aclara en lugar de mostrar un hash vacío', async () => {
    openDetail(detail({ digitalSignHash: null, attachments: [] }), verification())

    expect(await screen.findByText(/sin hash \(registro anterior/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Copiar hash' })).toBeNull()
  })

  it('verifica recién al pedirlo y muestra el resultado íntegro', async () => {
    const fetchMock = openDetail(detail(), verification())
    await screen.findByText('Integridad del documento')
    expect(verifyCalls(fetchMock)).toBe(0)

    fireEvent.click(screen.getByRole('button', { name: 'Verificar integridad' }))

    const result = await screen.findByRole('status', { name: 'Resultado de la verificación' })
    expect(verifyCalls(fetchMock)).toBe(1)
    expect(within(result).getAllByText('Íntegro')).toHaveLength(3) // general, acta y anexo
    expect(within(result).getByText(/Anexo del/)).toBeTruthy()
    expect(within(result).getByText('El acta no tiene firma electrónica.')).toBeTruthy()
  })

  it('marca como alterado el anexo modificado y explica el motivo', async () => {
    openDetail(
      detail(),
      verification({
        status: 'ALTERED',
        attachments: [
          {
            id: 'a1',
            documentUuid: 'b33ab5cb-d67d-4b51-8149-ddc6b952a9f2',
            status: 'ALTERED',
            reasons: ['CONTENT_CHANGED'],
          },
        ],
      })
    )
    await screen.findByText('Integridad del documento')

    fireEvent.click(screen.getByRole('button', { name: 'Verificar integridad' }))

    const result = await screen.findByRole('status', { name: 'Resultado de la verificación' })
    expect(within(result).getAllByText('Alterado')).toHaveLength(2) // general y anexo
    expect(within(result).getByText('Íntegro')).toBeTruthy() // el acta original
    expect(within(result).getByText('El contenido no coincide con el hash guardado.')).toBeTruthy()
  })

  it('avisa si el contenido cambió después de la firma electrónica', async () => {
    openDetail(
      detail(),
      verification({ status: 'ALTERED', signature: { status: 'MISMATCH', signedAt: null } })
    )
    await screen.findByText('Integridad del documento')

    fireEvent.click(screen.getByRole('button', { name: 'Verificar integridad' }))

    expect(
      await screen.findByText('El contenido cambió después de la firma electrónica.')
    ).toBeTruthy()
  })

  it('muestra el error del back si no se puede verificar', async () => {
    loginAs('EOE_DIRECTIVE')
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('/verify')
          ? {
              ok: false,
              status: 403,
              json: async () => ({ success: false, error: 'No tenés permiso' }),
            }
          : { ok: true, status: 200, json: async () => ({ success: true, data: detail() }) }
      )
    )
    render(<ConflictAttachments conflictId="c1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver acta y anexos' }))
    await screen.findByText('Integridad del documento')

    fireEvent.click(screen.getByRole('button', { name: 'Verificar integridad' }))

    expect(await screen.findByText('No tenés permiso')).toBeTruthy()
    expect(screen.queryByRole('status', { name: 'Resultado de la verificación' })).toBeNull()
  })
})
