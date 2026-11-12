// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useEdteMeetings } from '@/hooks/useEdteMeetings'
import type { EdteMeetingSummary } from '@/services/edteMeeting.service'

// El servicio se reemplaza por pedidos que el test resuelve cuando quiere, para forzar el orden
// en que llegan las respuestas (incluso si el pedido anterior no respeta la cancelación)
const pending: Array<{
  filters: unknown
  resolve: (data: EdteMeetingSummary[]) => void
  reject: (error: Error) => void
}> = []

vi.mock('@/services/edteMeeting.service', () => ({
  listEdteMeetings: vi.fn(
    (filters: unknown) =>
      new Promise<EdteMeetingSummary[]>((resolve, reject) => {
        pending.push({ filters, resolve, reject })
      })
  ),
}))

const meeting = (id: string): EdteMeetingSummary => ({
  id,
  year: 2026,
  date: '2026-03-02',
  period: 'FEBRUARY_MARCH',
  shift: null,
  status: 'DRAFT',
  minutesUrl: null,
  membersCount: 0,
  presentCount: 0,
  studentsCount: 0,
  signedAt: null,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
})

afterEach(() => {
  cleanup()
  pending.length = 0
})

describe('useEdteMeetings', () => {
  it('carga el listado con los filtros', async () => {
    const { result } = renderHook(() => useEdteMeetings({ year: 2026 }))
    expect(result.current.loading).toBe(true)
    await act(async () => pending[0]?.resolve([meeting('a')]))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data?.map((item) => item.id)).toEqual(['a'])
  })

  it('con filtros que cambian rápido, la respuesta vieja no pisa a la nueva', async () => {
    const { result, rerender } = renderHook(({ year }) => useEdteMeetings({ year }), {
      initialProps: { year: 2025 },
    })
    rerender({ year: 2026 })
    expect(pending).toHaveLength(2)

    // Llega primero la respuesta del pedido nuevo (2026) y después la del viejo (2025)
    await act(async () => pending[1]?.resolve([meeting('de-2026')]))
    await act(async () => pending[0]?.resolve([meeting('de-2025')]))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data?.map((item) => item.id)).toEqual(['de-2026'])
  })

  it('un error del pedido viejo tampoco pisa a la respuesta nueva', async () => {
    const { result, rerender } = renderHook(({ year }) => useEdteMeetings({ year }), {
      initialProps: { year: 2025 },
    })
    rerender({ year: 2026 })

    await act(async () => pending[1]?.resolve([meeting('de-2026')]))
    await act(async () => pending[0]?.reject(new Error('falló el viejo')))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeUndefined()
    expect(result.current.data?.map((item) => item.id)).toEqual(['de-2026'])
  })

  it('reload vuelve a pedir el listado', async () => {
    const { result } = renderHook(() => useEdteMeetings({ year: 2026 }))
    await act(async () => pending[0]?.resolve([meeting('a')]))
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.reload())
    expect(pending).toHaveLength(2)
  })
})
