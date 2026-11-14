import { describe, it, expect } from 'vitest'
import { validatePateClientState, type PateFormState } from './pateFormValidation'
import type { PatePendingSubjectOption, PateSectionOption } from '@/services/pate.service'

describe('CRM-079: validatePateClientState (Validación del formulario PATE)', () => {
  const pendingSubjects: PatePendingSubjectOption[] = [
    {
      pendingSubjectId: 'p1',
      subjectId: 's1',
      subjectName: 'Matemática',
      gradeLevel: 1,
      originYear: 2025,
    },
    {
      pendingSubjectId: 'p2',
      subjectId: 's2',
      subjectName: 'Lengua',
      gradeLevel: 1,
      originYear: 2025,
    },
    {
      pendingSubjectId: 'p3',
      subjectId: 's3',
      subjectName: 'Historia',
      gradeLevel: 1,
      originYear: 2025,
    },
    {
      pendingSubjectId: 'p4',
      subjectId: 's4',
      subjectName: 'Geografía',
      gradeLevel: 1,
      originYear: 2025,
    },
    {
      pendingSubjectId: 'p5',
      subjectId: 's5',
      subjectName: 'Biología',
      gradeLevel: 1,
      originYear: 2025,
    },
  ]

  const sections: PateSectionOption[] = [
    { id: 'sec-1A', grade: 1, division: 'A', shift: 'MORNING' },
  ]

  const baseState: PateFormState = {
    edteMeetingId: 'meet-1',
    diagnosis: 'Diagnóstico pedagógico',
    supportStrategies: 'Estrategias de apoyo',
    schedule: 'Lunes y miércoles',
    intensifyMap: new Map(),
    repeatMap: new Map(),
  }

  const options = {
    currentSubjectsCount: 8,
    maxSubjectsPerCycle: 12,
    pendingSubjects,
    sections,
  }

  it('valida correctamente un estado completo sin errores', () => {
    const state: PateFormState = {
      ...baseState,
      intensifyMap: new Map([
        ['p1', { pendingSubjectId: 'p1', model: 'MODEL_1', targetClassSectionId: '' }],
      ]),
      repeatMap: new Map([['p2', { pendingSubjectId: 'p2', classSectionId: 'sec-1A' }]]),
    }

    const res = validatePateClientState(state, options)
    expect(res.valid).toBe(true)
    expect(res.errors.length).toBe(0)
  })

  it('exige reunión de EDTE, diagnóstico y estrategias', () => {
    const invalidState: PateFormState = {
      ...baseState,
      edteMeetingId: '',
      diagnosis: '',
      supportStrategies: '',
    }

    const res = validatePateClientState(invalidState, options)
    expect(res.valid).toBe(false)
    expect(res.errors.length).toBe(3)
  })

  it('rechaza más de 4 materias a intensificar', () => {
    const tooManyIntensifyState: PateFormState = {
      ...baseState,
      intensifyMap: new Map([
        ['p1', { pendingSubjectId: 'p1', model: 'MODEL_1', targetClassSectionId: '' }],
        ['p2', { pendingSubjectId: 'p2', model: 'MODEL_1', targetClassSectionId: '' }],
        ['p3', { pendingSubjectId: 'p3', model: 'MODEL_1', targetClassSectionId: '' }],
        ['p4', { pendingSubjectId: 'p4', model: 'MODEL_1', targetClassSectionId: '' }],
        ['p5', { pendingSubjectId: 'p5', model: 'MODEL_1', targetClassSectionId: '' }],
      ]),
    }

    const res = validatePateClientState(tooManyIntensifyState, options)
    expect(res.valid).toBe(false)
    expect(res.errors.join('; ')).toMatch(/hasta 4 materias/)
  })

  it('exige sección obligatoria para modelos 2 y 3', () => {
    const missingSectionState: PateFormState = {
      ...baseState,
      intensifyMap: new Map([
        ['p1', { pendingSubjectId: 'p1', model: 'MODEL_2', targetClassSectionId: '' }],
      ]),
    }

    const res = validatePateClientState(missingSectionState, options)
    expect(res.valid).toBe(false)
    expect(res.errors.join('; ')).toMatch(/modelos 2 y 3 requieren elegir año\/sección\/turno/)
  })

  it('exige sección para materias a recursar', () => {
    const missingRepeatSectionState: PateFormState = {
      ...baseState,
      repeatMap: new Map([['p2', { pendingSubjectId: 'p2', classSectionId: '' }]]),
    }

    const res = validatePateClientState(missingRepeatSectionState, options)
    expect(res.valid).toBe(false)
    expect(res.errors.join('; ')).toMatch(/requiere elegir año\/sección\/turno para recursar/)
  })

  it('rechaza superar el límite total de 12 materias', () => {
    const limitOptions = {
      ...options,
      currentSubjectsCount: 11,
      maxSubjectsPerCycle: 12,
    }

    const overflowState: PateFormState = {
      ...baseState,
      repeatMap: new Map([
        ['p1', { pendingSubjectId: 'p1', classSectionId: 'sec-1A' }],
        ['p2', { pendingSubjectId: 'p2', classSectionId: 'sec-1A' }],
      ]), // 11 + 2 = 13 > 12
    }

    const res = validatePateClientState(overflowState, limitOptions)
    expect(res.valid).toBe(false)
    expect(res.errors.join('; ')).toMatch(/máximo es 12/)
  })
})
