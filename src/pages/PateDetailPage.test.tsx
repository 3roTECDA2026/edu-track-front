// @vitest-environment jsdom
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PateDetailPage from '@/pages/PateDetailPage'
import * as pateService from '@/services/pate.service'
import * as edteMeetingService from '@/services/edteMeeting.service'
import * as sessionService from '@/services/session'

vi.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockPate: pateService.PateResponse = {
  id: 'pate-1',
  year: 2026,
  status: 'IN_PROGRESS',
  view: 'FULL',
  student: {
    id: 'std-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    dni: '45123456',
  },
  edteMeeting: {
    id: 'meet-1',
    date: '2026-03-01',
    period: 'Marzo',
  },
  diagnosis: 'Diagnóstico de prueba inicial',
  supportStrategies: 'Tutorías personalizadas',
  schedule: 'Marzo a Noviembre',
  notificationUrl: null,
  createdBy: {
    id: 'usr-1',
    name: 'Fernanda Rodríguez',
  },
  closedBy: null,
  closedAt: null,
  finalEvaluation: null,
  finalObservations: null,
  createdAt: '2026-03-01T10:00:00.000Z',
  updatedAt: '2026-03-01T10:00:00.000Z',
  subjectsToIntensify: [
    {
      id: 'item-1',
      subjectId: 'sub-1',
      subjectName: 'Matemática',
      gradeLevel: 2,
      originYear: 2025,
      model: 'MODEL_1',
      targetClassSection: null,
    },
  ],
  subjectsToRepeat: [
    {
      id: 'item-2',
      subjectId: 'sub-2',
      subjectName: 'Historia',
      gradeLevel: 2,
      originYear: 2025,
      classSection: {
        id: 'sec-1',
        grade: 2,
        division: 'B',
        shift: 'MORNING',
      },
    },
  ],
}

const mockFollowUps: pateService.PateFollowUp[] = [
  {
    id: 'fu-1',
    pateId: 'pate-1',
    date: '2026-05-10T10:00:00.000Z',
    progress: 'El alumno asistió a todas las clases de apoyo.',
    evaluation: 'FAVORABLE',
    observations: 'Excelente predisposición.',
    createdAt: '2026-05-10T10:00:00.000Z',
    edteMeeting: {
      id: 'meet-2',
      date: '2026-05-10',
      period: 'Mayo',
    },
    createdBy: {
      id: 'usr-1',
      name: 'Fernanda Rodríguez',
    },
  },
]

const mockMeetings: edteMeetingService.EdteMeetingSummary[] = [
  {
    id: 'meet-2',
    year: 2026,
    date: '2026-05-10',
    period: 'AUGUST',
    shift: 'MORNING',
    status: 'SIGNED',
    minutesUrl: null,
    membersCount: 4,
    presentCount: 4,
    studentsCount: 3,
    signedAt: '2026-05-10T12:00:00.000Z',
    createdAt: '2026-05-10T10:00:00.000Z',
    updatedAt: '2026-05-10T10:00:00.000Z',
  },
]

const mockMeetingDetail: edteMeetingService.EdteMeetingDetail = {
  ...mockMeetings[0],
  considerations: null,
  createdBy: null,
  signedBy: null,
  members: [],
  students: [
    {
      studentId: 'std-1',
      firstName: 'Juan',
      lastName: 'Pérez',
      dni: '45123456',
      section: null,
      pendingSubjectsCount: 0,
      notes: null,
      pate: null,
    },
  ],
}

describe('PateDetailPage', () => {
  beforeEach(() => {
    vi.spyOn(sessionService, 'canManageTrajectories').mockReturnValue(true)
    vi.spyOn(pateService, 'getPate').mockResolvedValue(mockPate)
    vi.spyOn(pateService, 'getPateFollowUps').mockResolvedValue(mockFollowUps)
    vi.spyOn(edteMeetingService, 'listEdteMeetings').mockResolvedValue(mockMeetings)
    vi.spyOn(edteMeetingService, 'getEdteMeeting').mockResolvedValue(mockMeetingDetail)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/pates/pate-1']}>
        <Routes>
          <Route path="/pates/:id" element={<PateDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

  it('muestra la información del estudiante, materias y el historial de seguimientos', async () => {
    renderComponent()

    expect(await screen.findByText('Plan de Acompañamiento a las Trayectorias (PATE)')).toBeTruthy()
    expect(screen.getAllByText(/Pérez, Juan/).length).toBeGreaterThan(0)
    expect(screen.getByText(/45123456/)).toBeTruthy()
    expect(screen.getByText('Diagnóstico de prueba inicial')).toBeTruthy()
    expect(screen.getByText('Tutorías personalizadas')).toBeTruthy()

    // Historial de seguimientos
    expect(screen.getByText('Historial de Seguimientos y Avances')).toBeTruthy()
    expect(screen.getByText('El alumno asistió a todas las clases de apoyo.')).toBeTruthy()
    expect(screen.getByText('Favorable')).toBeTruthy()
    expect(screen.getByText('Excelente predisposición.')).toBeTruthy()
  })

  it('permite registrar un nuevo seguimiento mediante el diálogo', async () => {
    const createSpy = vi.spyOn(pateService, 'createPateFollowUp').mockResolvedValue({
      id: 'fu-2',
      pateId: 'pate-1',
      date: '2026-06-15T00:00:00.000Z',
      progress: 'Nuevo progreso verificado',
      evaluation: 'PARTIAL',
      observations: 'Requiere más foco',
      createdAt: '2026-06-15T00:00:00.000Z',
      edteMeeting: {
        id: 'meet-2',
        date: '2026-05-10',
        period: 'Mayo',
      },
      createdBy: null,
    })

    renderComponent()
    await screen.findByText('Plan de Acompañamiento a las Trayectorias (PATE)')

    fireEvent.click(screen.getByRole('button', { name: /agregar seguimiento/i }))

    expect(screen.getByRole('heading', { name: /agregar seguimiento del pate/i })).toBeTruthy()

    // Seleccionar reunión
    const meetingSelect = screen.getByLabelText(/reunión del edte/i)
    fireEvent.mouseDown(meetingSelect)
    const meetingOption = await screen.findByRole('option', { name: /10\/05\/2026/i })
    fireEvent.click(meetingOption)

    // Seleccionar evaluación
    fireEvent.mouseDown(screen.getByLabelText(/evaluación de resultados/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Parcial' }))

    // Llenar avances
    fireEvent.change(screen.getByLabelText(/avances observados/i), {
      target: { value: 'Nuevo progreso verificado' },
    })

    const saveBtn = screen.getByRole('button', { name: /guardar seguimiento/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        'pate-1',
        expect.objectContaining({
          edteMeetingId: 'meet-2',
          progress: 'Nuevo progreso verificado',
          evaluation: 'PARTIAL',
        })
      )
    })
  })

  it('en la vista curricular oculta la información reservada y las observaciones', async () => {
    vi.mocked(pateService.getPate).mockResolvedValue({ ...mockPate, view: 'CURRICULAR' })

    renderComponent()
    await screen.findByText('Plan de Acompañamiento a las Trayectorias (PATE)')

    expect(
      screen.getByText(
        'La información pedagógica reservada del EDTE no está disponible en esta vista.'
      )
    ).toBeTruthy()
    expect(screen.queryByText('Diagnóstico de prueba inicial')).toBeNull()
    expect(screen.queryByText('Tutorías personalizadas')).toBeNull()
    expect(screen.queryByText('Excelente predisposición.')).toBeNull()
    expect(screen.queryByRole('columnheader', { name: 'Observaciones' })).toBeNull()
    expect(screen.getByText('Materias a Intensificar')).toBeTruthy()
    expect(screen.getByText('Materias a Recursar')).toBeTruthy()
  })

  it('no ofrece reuniones firmadas donde el alumno no fue tratado', async () => {
    const draftMeeting: edteMeetingService.EdteMeetingSummary = {
      ...mockMeetings[0],
      id: 'meet-draft',
      date: '2026-06-20',
      period: 'ADDITIONAL',
      status: 'DRAFT',
    }
    const otherMeeting: edteMeetingService.EdteMeetingSummary = {
      ...mockMeetings[0],
      id: 'meet-other',
      date: '2026-04-01',
    }
    vi.mocked(edteMeetingService.listEdteMeetings).mockResolvedValue([
      ...mockMeetings,
      draftMeeting,
      otherMeeting,
    ])
    vi.mocked(edteMeetingService.getEdteMeeting).mockImplementation(async (meetingId) => ({
      ...mockMeetingDetail,
      id: meetingId,
      students:
        meetingId === otherMeeting.id
          ? [{ ...mockMeetingDetail.students[0], studentId: 'std-2' }]
          : mockMeetingDetail.students,
    }))

    renderComponent()
    await screen.findByText('Plan de Acompañamiento a las Trayectorias (PATE)')
    await waitFor(() => expect(edteMeetingService.getEdteMeeting).toHaveBeenCalledTimes(2))

    fireEvent.click(screen.getByRole('button', { name: /agregar seguimiento/i }))
    fireEvent.mouseDown(screen.getByLabelText(/reunión del edte/i))

    expect(await screen.findByRole('option', { name: /20\/06\/2026.*Borrador/i })).toBeTruthy()
    expect(screen.queryByRole('option', { name: /01\/04\/2026/i })).toBeNull()
  })

  it('exige la evaluación antes de guardar un seguimiento', async () => {
    const createSpy = vi
      .spyOn(pateService, 'createPateFollowUp')
      .mockResolvedValue(mockFollowUps[0])

    renderComponent()
    await screen.findByText('Plan de Acompañamiento a las Trayectorias (PATE)')
    await waitFor(() => expect(edteMeetingService.listEdteMeetings).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: /agregar seguimiento/i }))
    fireEvent.mouseDown(screen.getByLabelText(/reunión del edte/i))
    fireEvent.click(await screen.findByRole('option', { name: /10\/05\/2026/i }))
    fireEvent.change(screen.getByLabelText(/avances observados/i), {
      target: { value: 'Nuevo progreso verificado' },
    })
    fireEvent.click(screen.getByRole('button', { name: /guardar seguimiento/i }))

    expect(await screen.findByText('Elegí la evaluación de resultados.')).toBeTruthy()
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('exige la evaluación final antes de cerrar el PATE', async () => {
    const changeStatusSpy = vi.spyOn(pateService, 'changePateStatus').mockResolvedValue(mockPate)

    renderComponent()
    await screen.findByText('Plan de Acompañamiento a las Trayectorias (PATE)')

    fireEvent.click(screen.getByRole('button', { name: /cerrar pate/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirmar cierre/i }))

    expect(await screen.findByText('Elegí la evaluación final de resultados.')).toBeTruthy()
    expect(changeStatusSpy).not.toHaveBeenCalled()
  })

  it('permite cerrar el PATE con una evaluación final', async () => {
    const changeStatusSpy = vi.spyOn(pateService, 'changePateStatus').mockResolvedValue({
      ...mockPate,
      status: 'CLOSED',
      finalEvaluation: 'FAVORABLE',
      finalObservations: 'Objetivos cumplidos satisfactoriamente',
      closedAt: '2026-11-14T00:00:00.000Z',
    })

    renderComponent()
    await screen.findByText('Plan de Acompañamiento a las Trayectorias (PATE)')

    // Click en Cerrar PATE
    const closeBtn = screen.getByRole('button', { name: /cerrar pate/i })
    fireEvent.click(closeBtn)

    expect(screen.getByRole('heading', { name: /cerrar plan de acompañamiento/i })).toBeTruthy()

    fireEvent.mouseDown(screen.getByLabelText(/evaluación final de resultados/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Favorable' }))

    // Llenar observaciones finales
    fireEvent.change(screen.getByLabelText(/observaciones y conclusiones finales/i), {
      target: { value: 'Objetivos cumplidos satisfactoriamente' },
    })

    const submitBtn = screen.getByRole('button', { name: /confirmar cierre/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(changeStatusSpy).toHaveBeenCalledWith(
        'pate-1',
        expect.objectContaining({
          status: 'CLOSED',
          finalEvaluation: 'FAVORABLE',
          finalObservations: 'Objetivos cumplidos satisfactoriamente',
        })
      )
    })
  })
})
