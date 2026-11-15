// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AssignmentsTab from '@/components/intensification/AssignmentsTab'
import type { IntensificationAssignment } from '@/services/intensification.service'
import type { IntensificationSchedule } from '@/services/intensificationSchedule.service'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

const TEACHER_ID = 'docente-1'

// Sesión de un docente: el token lleva el rol y el id, como lo lee la pantalla
function loginTeacher() {
  const payload = btoa(JSON.stringify({ role: 'TEACHER', userId: TEACHER_ID })).replace(/=/g, '')
  sessionStorage.setItem('token', `x.${payload}.y`)
}

const schedule: IntensificationSchedule = {
  id: 'sch1',
  year: 2026,
  period: 'DECEMBER',
  startDate: '2026-12-01T00:00:00.000Z',
  endDate: '2026-12-12T00:00:00.000Z',
  assignedStudents: 2,
  subjects: [],
} as unknown as IntensificationSchedule

const assignment = (
  id: string,
  lastName: string,
  teacherId: string,
  resultCode: string | null
): IntensificationAssignment =>
  ({
    id,
    pendingSubjectId: `p-${id}`,
    student: { id: `s-${id}`, firstName: 'Ana', lastName, dni: '1' },
    subject: { id: 'm1', name: 'Matemática', gradeLevel: 2 },
    course: null,
    period: 'DECEMBER',
    model: 'MODEL_1',
    targetClassSection: null,
    responsibleTeacher: { id: teacherId, name: 'Docente' },
    resultCode,
    score: resultCode === 'AA' ? 7 : null,
    pendingKnowledge: null,
    knowledgeAtClose: null,
    evaluationDate: null,
  }) as unknown as IntensificationAssignment

const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  ),
  (char) => char.charCodeAt(0)
)

function stubBackend() {
  const rows = [
    assignment('mio', 'García', TEACHER_ID, 'AA'),
    assignment('ajeno', 'López', 'otro-docente', null),
  ]
  const fetchMock = vi.fn(async (url: string) => {
    const body = url.includes('/attachments')
      ? [{ id: 'a1' }]
      : url.includes('/api/intensifications')
        ? rows
        : []
    return { ok: true, status: 200, json: async () => body }
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('adjuntar evidencias desde las asignaciones (CRM-060)', () => {
  it('con AA se pueden adjuntar evidencias sin volver a cargar el resultado', async () => {
    loginTeacher()
    const fetchMock = stubBackend()
    const onMessage = vi.fn()
    render(
      <AssignmentsTab
        schedules={[schedule]}
        canEdit={false}
        onMessage={onMessage}
        onChanged={vi.fn()}
      />
    )

    const mine = (await screen.findByText('García, Ana')).closest('tr') as HTMLElement
    // Con AA el resultado no se vuelve a cargar, pero las evidencias sí se pueden sumar
    expect(within(mine).queryByRole('button', { name: /cargar resultado/i })).toBeNull()
    const attach = within(mine).getByRole('button', { name: 'Adjuntar evidencias de García, Ana' })

    // En la fila de otro docente no puede adjuntar
    const other = screen.getByText('López, Ana').closest('tr') as HTMLElement
    expect(within(other).queryByRole('button', { name: /adjuntar evidencias/i })).toBeNull()

    fireEvent.click(attach)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, {
      target: { files: [new File([PNG], 'tp.png', { type: 'image/png' })] },
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Adjuntar' }))

    await waitFor(() =>
      expect(onMessage).toHaveBeenCalledWith('Se adjuntó 1 evidencia.', 'success')
    )
    const urls = fetchMock.mock.calls.map(([url]) => String(url))
    expect(
      urls.filter((url) => url.includes('/api/intensifications/mio/attachments'))
    ).toHaveLength(1)
    // El resultado no se tocó
    expect(urls.some((url) => url.includes('/result'))).toBe(false)
  })
})
