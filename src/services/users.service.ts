import { fetchApi } from '@/services/api'

export interface UserOption {
  id: string
  firstName?: string
  lastName?: string
}

export async function searchUsers(query: string): Promise<UserOption[]> {
  const res = await fetchApi<{ data: UserOption[] }>(`/api/users?search=${encodeURIComponent(query)}`)
  return res.data ?? []
}
