import { useState } from 'react'

import {
  createIntervention,
  type CreateInterventionInput,
  type Intervention,
} from '@/services/interventions.service'

export function useCreateIntervention() {
  const [saving, setSaving] = useState(false)

  // Guarda y deja propagar el error, para que la pantalla muestre el mensaje del back.
  const save = async (input: CreateInterventionInput): Promise<Intervention> => {
    setSaving(true)
    try {
      return await createIntervention(input)
    } finally {
      setSaving(false)
    }
  }

  return { saving, save }
}
