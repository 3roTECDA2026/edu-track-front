import { useEffect, useState } from 'react'

import {
  listEdteTeamMembers,
  type EdteShift,
  type EdteStatusFilter,
  type EdteTeamMember,
} from '@/services/edteMembers.service'

interface EdteMembersState {
  key: string
  members?: EdteTeamMember[]
  error?: string
}

export function useEdteMembers(status: EdteStatusFilter = 'active', shift?: EdteShift) {
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState<EdteMembersState>({ key: '' })

  const requestKey = `${status}:${shift ?? ''}:${reloadKey}`

  useEffect(() => {
    const controller = new AbortController()

    listEdteTeamMembers({ status, shift }, controller.signal)
      .then((members) => setState({ key: requestKey, members }))
      .catch((e: unknown) => {
        if (controller.signal.aborted) return
        const message = e instanceof Error ? e.message : 'No se pudo cargar el listado.'
        setState({ key: requestKey, error: message })
      })

    return () => controller.abort()
  }, [status, shift, requestKey])

  const loading = state.key !== requestKey

  return {
    members: loading ? [] : (state.members ?? []),
    loading,
    error: loading ? null : (state.error ?? null),
    reload: () => setReloadKey((key) => key + 1),
  }
}
