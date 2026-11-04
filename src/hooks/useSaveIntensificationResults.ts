import { useState } from 'react'

import {
  intensificationService,
  type RegisterResultInput,
} from '@/services/intensification.service'

export interface IntensificationResultToSave {
  id: string // id del intento de intensificación
  studentName: string
  input: RegisterResultInput
}

// Guarda los resultados de intensificación cargados desde la grilla (CRM-066), con el endpoint
// de la CRM-058. Devuelve los errores por alumno y los ids de los que fallaron, para que la
// grilla conserve esos cambios en pantalla (por ejemplo, si un docente no es el responsable).
export function useSaveIntensificationResults() {
  const [saving, setSaving] = useState(false)

  async function save(results: IntensificationResultToSave[]) {
    setSaving(true)
    const errors: string[] = []
    const failedIds: string[] = []
    try {
      for (const result of results) {
        try {
          await intensificationService.registerResult(result.id, result.input)
        } catch (err: unknown) {
          failedIds.push(result.id)
          errors.push(
            `${result.studentName}: ${err instanceof Error ? err.message : 'no se pudo guardar'}`
          )
        }
      }
    } finally {
      setSaving(false)
    }
    return { errors, failedIds }
  }

  return { save, saving }
}
