import { useEffect, useState } from 'react'
import { listEdteMembers, type EdteMember } from '@/services/edteMembers.service'

export function useEdteMembers() {
  const [members, setMembers] = useState<EdteMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    listEdteMembers()
      .then(setMembers)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])

  return { members, loading, error }
}
