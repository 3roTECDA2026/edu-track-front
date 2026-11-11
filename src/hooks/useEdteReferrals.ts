import { useEffect, useState } from 'react'

import { buildReferralRows, type ReferralRow } from '@/components/edteReferrals/referralRows'
import { ApiError } from '@/services/api'
import { listEdteReferrals, listPatesByYear } from '@/services/edteReferrals.service'

interface UseEdteReferralsResult {
  rows: ReferralRow[]
  loading: boolean
  error: string | undefined
  forbidden: boolean // 403: el usuario no tiene acceso al listado
  pateUnavailable: boolean // No se pudo saber el estado del PATE: el listado se muestra igual
  reload: () => void
}

interface State {
  key: string
  rows: ReferralRow[]
  error?: string
  forbidden?: boolean
  pateUnavailable?: boolean
}

// Derivados al EDTE al cierre del ciclo anterior a `pateYear`, con el estado de su PATE en
// `pateYear` (CRM-074). Si cambia el ciclo antes de que lleguen las respuestas, cancela los pedidos
// anteriores para que no pisen a los nuevos (mismo patrón que useStudents).
export function useEdteReferrals(pateYear: number): UseEdteReferralsResult {
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState<State>({ key: '', rows: [] })

  const requestKey = `${pateYear}:${reloadKey}`

  useEffect(() => {
    const controller = new AbortController()

    Promise.allSettled([
      listEdteReferrals(pateYear - 1, controller.signal),
      listPatesByYear(pateYear, controller.signal),
    ]).then(([referrals, pates]) => {
      // Si ya llegó otro pedido (o se desmontó), estas respuestas son viejas: se descartan
      if (controller.signal.aborted) return

      if (referrals.status === 'rejected') {
        const err: unknown = referrals.reason
        setState({
          key: requestKey,
          rows: [],
          error: err instanceof Error ? err.message : 'Error inesperado',
          forbidden: err instanceof ApiError && err.status === 403,
        })
        return
      }

      const pateList = pates.status === 'fulfilled' ? pates.value : []
      setState({
        key: requestKey,
        rows: buildReferralRows(referrals.value, pateList),
        pateUnavailable: pates.status === 'rejected',
      })
    })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  const loading = state.key !== requestKey

  return {
    rows: loading ? [] : state.rows,
    loading,
    error: loading ? undefined : state.error,
    forbidden: !loading && Boolean(state.forbidden),
    pateUnavailable: !loading && Boolean(state.pateUnavailable),
    reload: () => setReloadKey((prev) => prev + 1),
  }
}
