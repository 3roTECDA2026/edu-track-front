import { useEffect, useState } from 'react'

import {
  getEdteDashboard,
  type DashboardFilters,
  type EdteDashboard,
} from '@/services/edteDashboard.service'
import { ApiError } from '@/services/api'

interface UseEdteDashboardResult {
  data: EdteDashboard | undefined
  loading: boolean
  error: string | undefined
  forbidden: boolean // 403: el usuario no tiene acceso al dashboard
  reload: () => void
}

// Dashboard del EDTE (CRM-077). Si cambian los filtros antes de que llegue la respuesta, cancela
// el pedido anterior para que no pise al nuevo (mismo patrón que useStudents).
export function useEdteDashboard(filters: DashboardFilters): UseEdteDashboardResult {
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState<{
    key: string
    data?: EdteDashboard
    error?: string
    forbidden?: boolean
  }>({ key: '' })

  const requestKey = JSON.stringify(filters) + `:${reloadKey}`

  useEffect(() => {
    const controller = new AbortController()

    getEdteDashboard(filters, controller.signal)
      .then((data) => setState({ key: requestKey, data }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const forbidden = err instanceof ApiError && err.status === 403
        const message = err instanceof Error ? err.message : 'Error inesperado'
        setState({ key: requestKey, error: message, forbidden })
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  const loading = state.key !== requestKey

  return {
    data: loading ? undefined : state.data,
    loading,
    error: loading ? undefined : state.error,
    forbidden: !loading && Boolean(state.forbidden),
    reload: () => setReloadKey((prev) => prev + 1),
  }
}
