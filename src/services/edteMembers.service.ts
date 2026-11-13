import { fetchApi } from '@/services/api'

export type EdteShift = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'EXTRA_TIME'

export type EdteRole = 'TEACHER' | 'PRECEPTOR' | 'COUNSELOR' | 'DIRECTIVE' | 'OTHER'

export type EdteStatusFilter = 'active' | 'inactive' | 'all'

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
  status?: EdteStatusFilter
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

export interface EdteMembership {
  id: string
  shift: EdteShift
  edteRole: EdteRole
  joinedAt: string
}

export interface MyEdteMembership {
  isMember: boolean
  memberships: EdteMembership[]
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

// Membresías del usuario logueado. Lo usan las pantallas que necesitan saber si mostrar
// las opciones del EDTE (CRM-077 y CRM-074).
export async function getMyEdteMembership(signal?: AbortSignal): Promise<MyEdteMembership> {
  return fetchApi<MyEdteMembership>('/api/edte-team-members/me', { signal })
}
