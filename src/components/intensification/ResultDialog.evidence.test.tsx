// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ResultDialog } from '@/components/intensification/ResultDialog'
import type { IntensificationAssignment } from '@/services/intensification.service'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// Intento que ya tenía un CCA: el diálogo lo trae cargado y se puede guardar sin tocar nada más
const assignment: IntensificationAssignment = {
  id: 'i1',
  pendingSubjectId: 'p1',
  student: { id: 's1', firstName: 'Mateo', lastName: 'García', dni: '46222333' },
  subject: { id: 'm1', name: 'Matemática', gradeLevel: 2 },
  course: null,
  period: 'DECEMBER',
  model: 'MODEL_1',
  targetClassSection: null,
  responsibleTeacher: null,
  resultCode: 'CCA',
  score: null,
  pendingKnowledge: null,
  knowledgeAtClose: null,
  evaluationDate: null,
} as unknown as IntensificationAssignment

const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  ),
  (char) => char.charCodeAt(0)
)

// fetch falso: el resultado siempre se guarda; la subida falla mientras `uploadFails` sea true
function stubBackend() {
  const state = { uploadFails: true }
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes('/attachments') && state.uploadFails) {
      return { ok: false, status: 500, json: async () => ({ error: 'Falló el servidor' }) }
    }
    const body = url.includes('/attachments') ? [{ id: 'a1' }] : { ...assignment }
    return { ok: true, status: init?.method === 'POST' ? 201 : 200, json: async () => body }
  })
  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, state }
}

const calls = (fetchMock: ReturnType<typeof vi.fn>, part: string) =>
  fetchMock.mock.calls.filter(([url]) => String(url).includes(part))

describe('evidencias al cargar el resultado (CRM-060)', () => {
  it('sube las evidencias después del resultado y, si fallan, reintenta sin volver a mandarlo', async () => {
    const { fetchMock, state } = stubBackend()
    const onSaved = vi.fn()
    const onClose = vi.fn()
    const { container } = render(
      <ResultDialog open assignment={assignment} onClose={onClose} onSaved={onSaved} />
    )

    const input = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, {
      target: { files: [new File([PNG], 'tp-hoja1.png', { type: 'image/png' })] },
    })
    expect(await screen.findByText('tp-hoja1.png')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar resultado' }))

    // El resultado se guardó; la subida falló y el botón pasa a reintentar
    expect(
      await screen.findByText(/el resultado se guardó, pero no se pudieron subir/i)
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar subida' })).toBeTruthy()
    expect(calls(fetchMock, '/result')).toHaveLength(1)
    expect(onSaved).not.toHaveBeenCalled()

    state.uploadFails = false
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar subida' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(onSaved.mock.calls[0][0]).toContain('Se adjuntó 1 evidencia')
    // El resultado no se volvió a mandar
    expect(calls(fetchMock, '/result')).toHaveLength(1)
    expect(calls(fetchMock, '/attachments')).toHaveLength(2)
    const [, init] = calls(fetchMock, '/attachments')[1]
    expect((init as RequestInit).body).toBeInstanceOf(FormData)
  })

  it('sin evidencias, guarda solo el resultado', async () => {
    const { fetchMock } = stubBackend()
    const onSaved = vi.fn()
    render(<ResultDialog open assignment={assignment} onClose={vi.fn()} onSaved={onSaved} />)

    fireEvent.click(screen.getByRole('button', { name: 'Guardar resultado' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(calls(fetchMock, '/attachments')).toHaveLength(0)
  })
})
