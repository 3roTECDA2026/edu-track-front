import { useEffect, useState } from 'react'

import {
  intensificationService,
  type IntensificationAssignment,
} from '@/services/intensification.service'

interface UseIntensificationsParams {
  scheduleId: string
  subjectId?: string
  classSectionId?: string
}

interface IntensificationsState {
  key: string
  items: IntensificationAssignment[]
  error: string | null
}

// Alumnos asignados a un período de intensificación, con filtros por materia y curso (CRM-056).
// Si los filtros cambian antes de que llegue la respuesta, se cancela el pedido anterior,
// así una respuesta vieja nunca pisa a una nueva (igual que useStudents).
export function useIntensifications({
  scheduleId,
  subjectId = '',
  classSectionId = '',
}: UseIntensificationsParams) {
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState<IntensificationsState>({ key: '', items: [], error: null })

  // Una clave por combinación de filtros: si cambia, se vuelve a pedir
  const requestKey = `${scheduleId}:${subjectId}:${classSectionId}:${reloadKey}`

  useEffect(() => {
    if (!scheduleId) return
    const controller = new AbortController()
    intensificationService
      .list({ scheduleId, subjectId, classSectionId }, controller.signal)
      .then((items) => setState({ key: requestKey, items, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return // El pedido viejo se canceló: no es un error
        setState({
          key: requestKey,
          items: [],
          error: err instanceof Error ? err.message : 'No se pudieron cargar las asignaciones.',
        })
      })
    return () => controller.abort()
  }, [scheduleId, subjectId, classSectionId, requestKey])

  // Está cargando mientras la respuesta guardada no sea la de los filtros actuales
  const loading = Boolean(scheduleId) && state.key !== requestKey

  return {
    items: !scheduleId || loading ? [] : state.items,
    loading,
    // Con error no se muestran datos viejos como si fueran actuales
    error: loading ? null : state.error,
    reload: () => setReloadKey((key) => key + 1),
  }
}
