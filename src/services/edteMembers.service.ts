import { fetchApi } from '@/services/api'

export type EdteShift = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'EXTRA_TIME'

export type EdteRole = 'TEACHER' | 'PRECEPTOR' | 'COUNSELOR' | 'DIRECTIVE' | 'OTHER'

export interface EdteTeamMember {
  id: string
  user: {
    id: string
    name: string
    role: string
  }
  shift: EdteShift
  edteRole: EdteRole
  active: boolean
  joinedAt: string
}

export interface ListEdteTeamMembersQuery {
  status?: 'active' | 'inactive' | 'all'
  shift?: EdteShift
}

export interface CreateEdteTeamMemberInput {
  userId: string
  shift: EdteShift
  edteRole: EdteRole
}

export interface UpdateEdteTeamMemberInput {
  edteRole: EdteRole
}

export interface EdteStaffOption {
  userId: string
  name: string
  role: string
}

export async function listEdteTeamMembers(
  query: ListEdteTeamMembersQuery = {},
  signal?: AbortSignal
): Promise<EdteTeamMember[]> {
  const params = new URLSearchParams()
  if (query.status) params.set('status', query.status)
  if (query.shift) params.set('shift', query.shift)
  const search = params.toString()
  return fetchApi<EdteTeamMember[]>(`/api/edte-team-members${search ? `?${search}` : ''}`, {
    signal,
  })
}

export async function createEdteTeamMember(
  input: CreateEdteTeamMemberInput
): Promise<EdteTeamMember> {
  return fetchApi<EdteTeamMember>('/api/edte-team-members', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateEdteTeamMember(
  id: string,
  input: UpdateEdteTeamMemberInput
): Promise<EdteTeamMember> {
  return fetchApi<EdteTeamMember>(`/api/edte-team-members/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deactivateEdteTeamMember(id: string): Promise<EdteTeamMember> {
  return fetchApi<EdteTeamMember>(`/api/edte-team-members/${encodeURIComponent(id)}/deactivate`, {
    method: 'PATCH',
  })
}

// Personal activo que puede integrar el EDTE. Se usa para el selector de alta porque
// /api/users es solo para administración y esta pantalla también la usa dirección/EOE.
export async function listEdteStaffOptions(signal?: AbortSignal): Promise<EdteStaffOption[]> {
  return fetchApi<EdteStaffOption[]>('/api/edte-meetings/member-options', { signal })
}
