import { useCallback, useEffect, useState } from 'react'

import {
  getInstitutionalConfig,
  updateInstitutionalConfig,
  type InstitutionalConfig,
  type UpdateInstitutionalConfigInput,
} from '@/services/institutionalConfig.service'

interface UseInstitutionalConfigResult {
  config: InstitutionalConfig | null
  loading: boolean
  error: string | null // solo error de la carga inicial
  saving: boolean
  save: (input: UpdateInstitutionalConfigInput) => Promise<InstitutionalConfig>
}

export function useInstitutionalConfig(): UseInstitutionalConfigResult {
  const [config, setConfig] = useState<InstitutionalConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    getInstitutionalConfig()
      .then((data) => {
        if (!active) return
        setConfig(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Error inesperado')
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  // El error de guardar se propaga (no toca el estado de carga), para que la pantalla
  // muestre el mensaje del back (ej. el 409 del plazo) sin tapar el formulario.
  const save = useCallback(
    async (input: UpdateInstitutionalConfigInput): Promise<InstitutionalConfig> => {
      setSaving(true)
      try {
        const updated = await updateInstitutionalConfig(input)
        setConfig(updated)
        return updated
      } finally {
        setSaving(false)
      }
    },
    []
  )

  return { config, loading, error, saving, save }
}
