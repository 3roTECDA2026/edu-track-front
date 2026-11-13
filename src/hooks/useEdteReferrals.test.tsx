// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useEdteReferrals } from '@/hooks/useEdteReferrals'
import { ApiError } from '@/services/api'
import {
  listEdteReferrals,
  listPatesByYear,
  type EdteReferral,
  type PateSummary,
} from '@/services/edteReferrals.service'

// Cada pedido queda pendiente hasta que el test lo resuelve, para controlar el orden de llegada
type Pending<T> = { year: number; resolve: (data: T) => void; reject: (error: Error) => void }
const referralRequests: Array<Pending<EdteReferral[]>> = []
const pateRequests: Array<Pending<PateSummary[]>> = []

vi.mock('@/services/edteReferrals.service', () => ({
  listEdteReferrals: vi.fn(
    (year: number) =>
      new Promise((resolve, reject) => referralRequests.push({ year, resolve, reject }))
  ),
  listPatesByYear: vi.fn(
    (year: number) => new Promise((resolve, reject) => pateRequests.push({ year, resolve, reject }))
  ),
}))

const referral = (id: string, lastName: string): EdteReferral => ({
  decisionId: `d-${id}`,
  decidedAt: '2026-02-10T12:00:00.000Z',
  pendingCountAtDecision: 5,
  pendingCount: 5,
  student: { id, firstName: 'Ana', lastName, dni: '40000000' },
  section: { id: 'c1', grade: 2, division: 'A', shift: 'MORNING' },
  pendingSubjects: [],
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  referralRequests.length = 0
  pateRequests.length = 0
})

describe('useEdteReferrals', () => {
  it('pide los derivados del ciclo anterior y los PATE del ciclo elegido, y los cruza', async () => {
    const { result } = renderHook(() => useEdteReferrals(2026))
    expect(result.current.loading).toBe(true)
    expect(listEdteReferrals).toHaveBeenCalledWith(2025, expect.any(AbortSignal))
    expect(listPatesByYear).toHaveBeenCalledWith(2026, expect.any(AbortSignal))

    await act(async () => {
      referralRequests[0].resolve([referral('s1', 'Pérez'), referral('s2', 'García')])
      pateRequests[0].resolve([{ id: 'p1', status: 'IN_PROGRESS', student: { id: 's2' } }])
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.rows.map((row) => [row.lastName, row.pate?.status ?? null])).toEqual([
      ['Pérez', null],
      ['García', 'IN_PROGRESS'],
    ])
    expect(result.current.pateUnavailable).toBe(false)
  })

  it('si falla el pedido de los PATE, muestra el listado igual y lo avisa', async () => {
    const { result } = renderHook(() => useEdteReferrals(2026))
    await act(async () => {
      referralRequests[0].resolve([referral('s1', 'Pérez')])
      pateRequests[0].reject(new ApiError(500, { error: 'Falló' }))
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rows).toHaveLength(1)
    expect(result.current.pateUnavailable).toBe(true)
    expect(result.current.error).toBeUndefined()
  })

  it('si falla el listado, informa el error', async () => {
    const { result } = renderHook(() => useEdteReferrals(2026))
    await act(async () => {
      referralRequests[0].reject(new ApiError(500, { error: 'No se pudo cargar' }))
      pateRequests[0].resolve([])
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('No se pudo cargar')
    expect(result.current.forbidden).toBe(false)
    expect(result.current.rows).toEqual([])
  })

  it('con 403 marca que no tiene acceso', async () => {
    const { result } = renderHook(() => useEdteReferrals(2026))
    await act(async () => {
      referralRequests[0].reject(new ApiError(403, { error: 'Prohibido' }))
      pateRequests[0].reject(new ApiError(403, { error: 'Prohibido' }))
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.forbidden).toBe(true)
  })

  it('si cambia el ciclo rápido, la respuesta vieja no pisa a la nueva', async () => {
    const { result, rerender } = renderHook(({ year }) => useEdteReferrals(year), {
      initialProps: { year: 2026 },
    })
    rerender({ year: 2025 })
    expect(referralRequests.map((request) => request.year)).toEqual([2025, 2024])

    // Llega primero la respuesta nueva y después la vieja
    await act(async () => {
      referralRequests[1].resolve([referral('new', 'Nuevo')])
      pateRequests[1].resolve([])
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      referralRequests[0].resolve([referral('old', 'Viejo')])
      pateRequests[0].resolve([])
    })

    expect(result.current.rows.map((row) => row.lastName)).toEqual(['Nuevo'])
  })

  it('reload vuelve a pedir los datos', async () => {
    const { result } = renderHook(() => useEdteReferrals(2026))
    await act(async () => {
      referralRequests[0].resolve([])
      pateRequests[0].resolve([])
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.reload())
    expect(result.current.loading).toBe(true)
    expect(referralRequests).toHaveLength(2)
  })
})
