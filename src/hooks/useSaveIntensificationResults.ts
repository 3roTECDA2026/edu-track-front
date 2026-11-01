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
// de la CRM-058. Devuelve los errores por alumno, para avisar cuáles no se pudieron guardar
// (por ejemplo, si un docente no es el responsable de ese alumno).
export function useSaveIntensificationResults() {
  const [saving, setSaving] = useState(false)

  async function save(results: IntensificationResultToSave[]) {
    setSaving(true)
    const errors: string[] = []
    try {
      for (const result of results) {
        try {
          await intensificationService.registerResult(result.id, result.input)
        } catch (err: unknown) {
          errors.push(
            `${result.studentName}: ${err instanceof Error ? err.message : 'no se pudo guardar'}`
          )
        }
      }
    } finally {
      setSaving(false)
    }
    return errors
  }

  return { save, saving }
}
