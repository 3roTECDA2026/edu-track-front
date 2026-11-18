import { describe, expect, it } from 'vitest'

import { ApiError } from '@/services/api'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

const fallback = 'No se pudo registrar la intervención.'

describe('getApiErrorMessage', () => {
  it('muestra el motivo de un error de validación del back', () => {
    const err = new ApiError(400, {
      error: 'Validation error',
      details: { formErrors: [], fieldErrors: { date: ['La fecha no puede ser futura'] } },
    })
    expect(getApiErrorMessage(err, fallback)).toBe('La fecha no puede ser futura')
  })

  it('junta varios motivos sin repetir', () => {
    const err = new ApiError(400, {
      error: 'Validation error',
      details: {
        formErrors: ['Hay que enviar al menos un campo'],
        fieldErrors: { a: ['Dato inválido'], b: ['Dato inválido'] },
      },
    })
    expect(getApiErrorMessage(err, fallback)).toBe('Hay que enviar al menos un campo Dato inválido')
  })

  it('sin detalle, no muestra "Validation error" sino el texto de la pantalla', () => {
    expect(getApiErrorMessage(new ApiError(400, { error: 'Validation error' }), fallback)).toBe(
      fallback
    )
  })

  it('usa el mensaje del back cuando ya es claro', () => {
    const err = new ApiError(400, { error: 'El alumno no pertenece al curso indicado' })
    expect(getApiErrorMessage(err, fallback)).toBe('El alumno no pertenece al curso indicado')
  })

  it('con la sesión vencida, pide volver a iniciar sesión', () => {
    expect(getApiErrorMessage(new ApiError(401, { error: 'Unauthorized' }), fallback)).toMatch(
      /sesión venció/
    )
  })
})
