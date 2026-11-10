// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useEdteDashboard } from '@/hooks/useEdteDashboard'
import { ApiError } from '@/services/api'
import type { EdteDashboard } from '@/services/edteDashboard.service'

// El servicio se reemplaza por pedidos que el test resuelve cuando quiere, para forzar el orden
// en que llegan las respuestas (incluso si el pedido anterior no respeta la cancelación)
const pending: Array<{
  resolve: (data: EdteDashboard) => void
  reject: (error: Error) => void
}> = []

vi.mock('@/services/edteDashboard.service', () => ({
  getEdteDashboard: vi.fn(
    () =>
      new Promise<EdteDashboard>((resolve, reject) => {
        pending.push({ resolve, reject })
      })
  ),
}))

const dashboard = (totalStudents: number): EdteDashboard => ({
  academicYear: 2026,
  term: 'FIRST',
  thresholds: { earlyWarningPending: 4, referredPending: 5, mediumTedCount: 1, highTedCount: 2 },
  indicators: {
    totalStudents,
    studentsByAssessment: { TEA: 0, TEP: 0, TED: 0, NONE: totalStudents },
    earlyWarning: 0,
    referred: 0,
    tedAssessments: 0,
  },
  students: [],
})

afterEach(() => {
  cleanup()
  pending.length = 0
})

describe('useEdteDashboard', () => {
  it('carga el dashboard con los filtros', async () => {
    const { result } = renderHook(() => useEdteDashboard({}))
    expect(result.current.loading).toBe(true)
    await act(async () => pending[0]?.resolve(dashboard(14)))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data?.indicators.totalStudents).toBe(14)
  })

  it('con filtros que cambian rápido, la respuesta vieja no pisa a la nueva', async () => {
    const { result, rerender } = renderHook(({ grade }) => useEdteDashboard({ grade }), {
      initialProps: { grade: 1 },
    })
    rerender({ grade: 2 })
    expect(pending).toHaveLength(2)

    // Llega primero la respuesta del pedido nuevo y después la del viejo
    await act(async () => pending[1]?.resolve(dashboard(22)))
    await act(async () => pending[0]?.resolve(dashboard(11)))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data?.indicators.totalStudents).toBe(22)
  })

  it('un error del pedido viejo tampoco pisa a la respuesta nueva', async () => {
    const { result, rerender } = renderHook(({ grade }) => useEdteDashboard({ grade }), {
      initialProps: { grade: 1 },
    })
    rerender({ grade: 2 })

    await act(async () => pending[1]?.resolve(dashboard(22)))
    await act(async () => pending[0]?.reject(new Error('falló el viejo')))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeUndefined()
    expect(result.current.data?.indicators.totalStudents).toBe(22)
  })

  it('un 403 se informa aparte, para mostrar "sin acceso"', async () => {
    const { result } = renderHook(() => useEdteDashboard({}))
    await act(async () => pending[0]?.reject(new ApiError(403, { error: 'Acceso denegado' })))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.forbidden).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('otro error no se toma como falta de acceso', async () => {
    const { result } = renderHook(() => useEdteDashboard({}))
    await act(async () => pending[0]?.reject(new ApiError(500, { error: 'Internal server error' })))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.forbidden).toBe(false)
    expect(result.current.error).toMatch(/internal server error/i)
  })

  it('reload vuelve a pedir el dashboard', async () => {
    const { result } = renderHook(() => useEdteDashboard({}))
    await act(async () => pending[0]?.resolve(dashboard(14)))
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.reload())
    expect(pending).toHaveLength(2)
  })
})
