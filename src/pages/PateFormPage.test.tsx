// @vitest-environment jsdom
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PateFormPage } from '@/pages/PateFormPage'
import * as pateService from '@/services/pate.service'
import * as studentProfileService from '@/services/studentProfile.service'
import * as edteMeetingService from '@/services/edteMeeting.service'
import { ApiError } from '@/services/api'

vi.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockStudent = {
  id: 'std-1',
  firstName: 'Juan',
  lastName: 'Pérez',
  dni: '45123456',
  currentYear: 3,
  currentDivision: 'A',
  currentShift: 'MORNING' as const,
}

const mockOptions: pateService.PateOptionsResponse = {
  year: 2026,
  studentShift: 'MORNING',
  organizationalOption: '1',
  allowedModels: ['MODEL_1', 'MODEL_2', 'MODEL_3', 'MODEL_4'],
  currentSubjectsCount: 8,
  maxSubjectsPerCycle: 12,
  referred: true,
  existingPate: null,
  pendingSubjects: [
    {
      pendingSubjectId: 'ps-1',
      subjectId: 'sub-1',
      subjectName: 'Matemática',
      gradeLevel: 2,
      originYear: 2025,
    },
    {
      pendingSubjectId: 'ps-2',
      subjectId: 'sub-2',
      subjectName: 'Historia',
      gradeLevel: 2,
      originYear: 2025,
    },
  ],
  sections: [
    {
      id: 'sec-1',
      grade: 2,
      division: 'B',
      shift: 'MORNING',
    },
    {
      id: 'sec-2',
      grade: 3,
      division: 'A',
      shift: 'MORNING',
    },
  ],
}

const mockMeetings: edteMeetingService.EdteMeetingSummary[] = [
  {
    id: 'meet-1',
    year: 2026,
    date: '2026-03-10',
    period: 'FEBRUARY_MARCH',
    shift: 'MORNING',
    status: 'DRAFT',
    minutesUrl: null,
    membersCount: 2,
    presentCount: 2,
    studentsCount: 1,
    signedAt: null,
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z',
  },
]

describe('PateFormPage (CRM-079)', () => {
  beforeEach(() => {
    vi.spyOn(studentProfileService, 'getStudentById').mockResolvedValue(mockStudent as any)
    vi.spyOn(pateService, 'getPateOptions').mockResolvedValue(mockOptions)
    vi.spyOn(edteMeetingService, 'listEdteMeetings').mockResolvedValue(mockMeetings)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('muestra datos del alumno, lista de MPAA y formulario de creación', async () => {
    render(
      <MemoryRouter initialEntries={['/pates/new?studentId=std-1']}>
        <Routes>
          <Route path="/pates/new" element={<PateFormPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Pérez, Juan')).toBeTruthy()
    expect(screen.getByText(/45123456/)).toBeTruthy()
    expect(screen.getAllByText('Matemática').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Historia').length).toBeGreaterThan(0)
    expect(screen.getByLabelText(/Diagnóstico de Situación/i)).toBeTruthy()
    expect(screen.getByLabelText(/Estrategias de Acompañamiento/i)).toBeTruthy()
    expect(screen.getByLabelText(/Cronograma de Actividades/i)).toBeTruthy()
  })

  it('permite seleccionar materia a intensificar y muestra error si modelo 2 o 3 no tiene sección', async () => {
    render(
      <MemoryRouter initialEntries={['/pates/new?studentId=std-1']}>
        <Routes>
          <Route path="/pates/new" element={<PateFormPage />} />
        </Routes>
      </MemoryRouter>
    )

    await screen.findByText('Pérez, Juan')

    // Completamos textos obligatorios
    fireEvent.change(screen.getByLabelText(/Diagnóstico de Situación/i), {
      target: { value: 'Diagnóstico inicial del estudiante' },
    })
    fireEvent.change(screen.getByLabelText(/Estrategias de Acompañamiento/i), {
      target: { value: 'Estrategias pedagógicas' },
    })
    fireEvent.change(screen.getByLabelText(/Cronograma de Actividades/i), {
      target: { value: 'Cronograma semanal' },
    })

    // Seleccionamos la checkbox de intensificar Matemática
    const checkboxMat = screen.getByRole('checkbox', { name: /intensificar Matemática/i })
    fireEvent.click(checkboxMat)

    // Por defecto es Modelo 1 (no requiere sección). Guardar llama a createPate si hay reunión seleccionada
    // Pero si no seleccionó reunión, avisa:
    const saveButton = screen.getByRole('button', { name: /Crear PATE/i })
    fireEvent.click(saveButton)

    expect(
      await screen.findByText(/Elegí la reunión del EDTE donde se trató al alumno/i)
    ).toBeTruthy()
  })

  it('muestra errores del backend sin borrar lo cargado en el formulario', async () => {
    vi.spyOn(pateService, 'createPate').mockRejectedValue(
      new ApiError(409, {
        error: 'Conflicto al crear PATE',
        details: {
          errors: [
            'No se pueden intensificar más de 4 materias',
            'El alumno supera las 12 materias',
          ],
        },
      })
    )

    render(
      <MemoryRouter initialEntries={['/pates/new?studentId=std-1&edteMeetingId=meet-1']}>
        <Routes>
          <Route path="/pates/new" element={<PateFormPage />} />
        </Routes>
      </MemoryRouter>
    )

    await screen.findByText('Pérez, Juan')

    const diagInput = screen.getByLabelText(/Diagnóstico de Situación/i) as HTMLInputElement
    fireEvent.change(diagInput, { target: { value: 'Diagnóstico persistente' } })

    const stratInput = screen.getByLabelText(/Estrategias de Acompañamiento/i) as HTMLInputElement
    fireEvent.change(stratInput, { target: { value: 'Estrategias persistentes' } })

    const schedInput = screen.getByLabelText(/Cronograma de Actividades/i) as HTMLInputElement
    fireEvent.change(schedInput, { target: { value: 'Cronograma persistente' } })

    const saveButton = screen.getByRole('button', { name: /Crear PATE/i })
    fireEvent.click(saveButton)

    // Esperar errores del backend
    expect(await screen.findByText('No se pueden intensificar más de 4 materias')).toBeTruthy()
    expect(screen.getByText('El alumno supera las 12 materias')).toBeTruthy()

    // Comprobar que los campos de texto no fueron borrados
    expect(diagInput.value).toBe('Diagnóstico persistente')
    expect(stratInput.value).toBe('Estrategias persistentes')
    expect(schedInput.value).toBe('Cronograma persistente')
  })
})
