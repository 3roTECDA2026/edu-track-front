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
    edteMeetingId: 'meet-2',
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

describe('PateDetailPage', () => {
  beforeEach(() => {
    vi.spyOn(sessionService, 'canManageTrajectories').mockReturnValue(true)
    vi.spyOn(pateService, 'getPate').mockResolvedValue(mockPate)
    vi.spyOn(pateService, 'getPateFollowUps').mockResolvedValue(mockFollowUps)
    vi.spyOn(edteMeetingService, 'listEdteMeetings').mockResolvedValue(mockMeetings)
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
      edteMeetingId: 'meet-2',
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

    // Click en botón Agregar Seguimiento (elegir el primero que aparece)
    const addBtns = screen.getAllByRole('button', { name: /agregar seguimiento/i })
    fireEvent.click(addBtns[0])

    expect(screen.getByRole('heading', { name: /agregar seguimiento del pate/i })).toBeTruthy()

    // Seleccionar reunión
    const meetingSelect = screen.getByLabelText(/reunión del edte/i)
    fireEvent.mouseDown(meetingSelect)
    const meetingOption = await screen.findByRole('option', { name: /2026-05-10/i })
    fireEvent.click(meetingOption)

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
        })
      )
    })
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
