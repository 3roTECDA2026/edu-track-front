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

export async function createEdteMember(input: { userId: string; roleInTeam: string; active?: boolean }): Promise<EdteMember> {
  const res = await fetchApi<{ data: EdteMember }>('/api/edte-members', { method: 'POST', body: JSON.stringify(input) })
  return res.data
}

export async function updateEdteMember(id: string, input: { roleInTeam?: string; active?: boolean }): Promise<EdteMember> {
  const res = await fetchApi<{ data: EdteMember }>(`/api/edte-members/${id}`, { method: 'PUT', body: JSON.stringify(input) })
  return res.data
}

export async function deactivateEdteMember(id: string): Promise<EdteMember> {
  const res = await fetchApi<{ data: EdteMember }>(`/api/edte-members/${id}`, { method: 'DELETE' })
  return res.data
}
