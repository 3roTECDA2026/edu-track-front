import { useEffect, useState } from 'react'

import {
  listEdteMeetings,
  type EdteMeetingSummary,
  type ListEdteMeetingsFilters,
} from '@/services/edteMeeting.service'

interface UseEdteMeetingsResult {
  data: EdteMeetingSummary[] | undefined
  loading: boolean
  error: string | undefined
  reload: () => void
}

// Listado de reuniones del EDTE (CRM-075). Si cambian los filtros antes de que llegue la
// respuesta, cancela el pedido anterior para que no pise al nuevo (mismo patrón que useStudents).
export function useEdteMeetings(filters: ListEdteMeetingsFilters): UseEdteMeetingsResult {
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState<{
    key: string
    data?: EdteMeetingSummary[]
    error?: string
  }>({ key: '' })

  const requestKey = JSON.stringify(filters) + `:${reloadKey}`

  useEffect(() => {
    const controller = new AbortController()

    listEdteMeetings(filters, controller.signal)
      .then((data) => {
        // Si ya llegó otro pedido (o se desmontó), esta respuesta es vieja: se descarta
        if (controller.signal.aborted) return
        setState({ key: requestKey, data })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : 'Error inesperado'
        setState({ key: requestKey, error: message })
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  const loading = state.key !== requestKey

  return {
    data: loading ? undefined : state.data,
    loading,
    error: loading ? undefined : state.error,
    reload: () => setReloadKey((prev) => prev + 1),
  }
}
