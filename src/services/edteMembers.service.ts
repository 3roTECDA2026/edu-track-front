import { fetchApi } from '@/services/api'

export interface EdteMember {
  id: string
  userId: string
  roleInTeam: string
  active: boolean
  user?: { firstName?: string; lastName?: string }
}

export async function listEdteMembers(): Promise<EdteMember[]> {
  const res = await fetchApi<{ data: EdteMember[] }>('/api/edte-members')
  return res.data ?? []
}
