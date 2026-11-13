import { useEffect, useState } from 'react'

import { getMyEdteMembership, type MyEdteMembership } from '@/services/edteMembers.service'

interface MyEdteMembershipState {
  data?: MyEdteMembership
  error?: string
  loading: boolean
}

export function useMyEdteMembership() {
  const [state, setState] = useState<MyEdteMembershipState>({ loading: true })

  useEffect(() => {
    const controller = new AbortController()

    getMyEdteMembership(controller.signal)
      .then((data) => setState({ data, loading: false }))
      .catch((e: unknown) => {
        if (controller.signal.aborted) return
        const message = e instanceof Error ? e.message : 'No se pudo cargar la membresía del EDTE.'
        setState({ error: message, loading: false })
      })

    return () => controller.abort()
  }, [])

  return state
}
