// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import EdteMembersPage from '@/pages/EdteMembersPage'
import type { EdteTeamMember } from '@/services/edteMembers.service'
import { loginAs, stubApi, withNotifications } from '@/test/edteTestUtils'

vi.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const member = (overrides: Partial<EdteTeamMember> = {}): EdteTeamMember => ({
  id: 'm1',
  user: { id: 'u1', name: 'Quiroga, Marcela', role: 'SCHOOL_MANAGEMENT' },
  shift: 'MORNING',
  edteRole: 'DIRECTIVE',
  active: true,
  joinedAt: '2026-03-01T00:00:00.000Z',
  ...overrides,
})

const staffOptions = [
  { userId: 'u1', name: 'Quiroga, Marcela', role: 'SCHOOL_MANAGEMENT' },
  { userId: 'u2', name: 'Méndez, Carla', role: 'TEACHER' },
]

const listUrl = (url: string) => url.includes('/api/edte-team-members?status=active')
const optionsUrl = (url: string) => url.includes('/api/edte-meetings/member-options')

const renderPage = () =>
  render(
    withNotifications(
      <MemoryRouter>
        <EdteMembersPage />
      </MemoryRouter>
    )
  )

type FetchCall = [string, RequestInit | undefined]

const findCall = (
  fetchMock: ReturnType<typeof stubApi>,
  predicate: (url: string, init?: RequestInit) => boolean
) => {
  const calls = fetchMock.mock.calls as unknown as FetchCall[]
  return calls.find(([url, init]) => predicate(url, init))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

describe('integrantes del EDTE', () => {
  it('lista y traduce el turno y el rol', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    stubApi([
      [optionsUrl, staffOptions],
      [listUrl, [member()]],
    ])
    renderPage()

    expect(await screen.findByText('Quiroga, Marcela')).toBeTruthy()
    expect(screen.getByText('Mañana')).toBeTruthy()
    expect(screen.getByText('Directivo/a')).toBeTruthy()
    expect(screen.getByText('Activo')).toBeTruthy()
  })

  it('si falla la carga no muestra el mensaje de vacío', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        statusText: 'Error',
        json: async () => ({ error: 'Internal server error' }),
      }))
    )
    renderPage()

    expect(await screen.findByText(/internal server error/i)).toBeTruthy()
    expect(screen.queryByText(/sin integrantes para los filtros seleccionados/i)).toBeNull()
  })

  it('en inactivos explica cómo reactivar', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    stubApi([
      [optionsUrl, staffOptions],
      [
        (url) => url.includes('/api/edte-team-members?status=inactive'),
        [member({ active: false })],
      ],
      [listUrl, []],
    ])
    renderPage()
    await screen.findByText(/sin integrantes/i)

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /estado/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Inactivos' }))

    expect(await screen.findByText(/para reactivar a un integrante/i)).toBeTruthy()
  })

  it('el alta manda userId, shift y edteRole', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    const fetchMock = stubApi([
      [optionsUrl, staffOptions],
      [listUrl, []],
      [
        (url) => url.endsWith('/api/edte-team-members'),
        member({
          id: 'm2',
          user: { id: 'u2', name: 'Méndez, Carla', role: 'TEACHER' },
          shift: 'AFTERNOON',
          edteRole: 'TEACHER',
        }),
      ],
    ])
    renderPage()
    await screen.findByText(/sin integrantes/i)

    fireEvent.click(screen.getByRole('button', { name: /nuevo integrante/i }))

    const userInput = await screen.findByRole('combobox', { name: /usuario/i })
    fireEvent.change(userInput, { target: { value: 'Méndez' } })
    fireEvent.click(await screen.findByRole('option', { name: 'Méndez, Carla' }))

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /turno/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Tarde' }))

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /rol/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Docente' }))

    const save = screen.getByRole('button', { name: /^guardar$/i })
    await waitFor(() => expect((save as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(save)

    await waitFor(() => {
      const postCall = findCall(
        fetchMock,
        (url, init) => url.endsWith('/api/edte-team-members') && init?.method === 'POST'
      )
      expect(postCall).toBeTruthy()
      expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({
        userId: 'u2',
        shift: 'AFTERNOON',
        edteRole: 'TEACHER',
      })
    })
  })

  it('la edición manda solo edteRole', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    const fetchMock = stubApi([
      [optionsUrl, staffOptions],
      [listUrl, [member()]],
      [
        (url) => url.includes('/api/edte-team-members/m1') && !url.includes('/deactivate'),
        member(),
      ],
    ])
    renderPage()
    await screen.findByText('Quiroga, Marcela')

    fireEvent.click(screen.getByRole('button', { name: /editar integrante/i }))

    fireEvent.mouseDown(await screen.findByRole('combobox', { name: /rol/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Docente' }))

    const save = screen.getByRole('button', { name: /^guardar$/i })
    await waitFor(() => expect((save as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(save)

    await waitFor(() => {
      const patchCall = findCall(
        fetchMock,
        (url, init) =>
          url.includes('/api/edte-team-members/m1') &&
          !url.includes('/deactivate') &&
          init?.method === 'PATCH'
      )
      expect(patchCall).toBeTruthy()
      expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({
        edteRole: 'TEACHER',
      })
    })
  })

  it('la baja pide confirmación con el nombre', async () => {
    loginAs('SCHOOL_MANAGEMENT')
    const fetchMock = stubApi([
      [optionsUrl, staffOptions],
      [listUrl, [member()]],
      [(url) => url.includes('/api/edte-team-members/m1/deactivate'), member({ active: false })],
    ])
    renderPage()
    await screen.findByText('Quiroga, Marcela')

    fireEvent.click(screen.getByRole('button', { name: /dar de baja/i }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/Quiroga, Marcela/)).toBeTruthy()
    expect(findCall(fetchMock, (url) => url.includes('/deactivate'))).toBeUndefined()

    fireEvent.click(within(dialog).getByRole('button', { name: /^dar de baja$/i }))

    await waitFor(() => {
      expect(
        findCall(
          fetchMock,
          (url, init) =>
            url.includes('/api/edte-team-members/m1/deactivate') && init?.method === 'PATCH'
        )
      ).toBeTruthy()
    })
  })
})
