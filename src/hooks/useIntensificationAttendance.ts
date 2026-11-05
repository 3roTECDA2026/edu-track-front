import { useEffect, useState } from 'react'

import {
  intensificationAttendanceService,
  type IntensificationAttendanceDay,
} from '@/services/intensificationAttendance.service'

interface UseIntensificationAttendanceParams {
  scheduleId: string
  subjectId: string
  date: string
  // false mientras la fecha no sea válida para el período: no se hace el pedido
  enabled: boolean
}

interface AttendanceState {
  key: string
  data: IntensificationAttendanceDay | null
  error: string | null
}

// Asistencia en intensificación de un período, una materia y una fecha (CRM-059).
// Si los filtros cambian antes de que llegue la respuesta, se cancela el pedido anterior,
// así una respuesta vieja nunca pisa a una nueva (igual que useIntensifications).
export function useIntensificationAttendance({
  scheduleId,
  subjectId,
  date,
  enabled,
}: UseIntensificationAttendanceParams) {
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState<AttendanceState>({ key: '', data: null, error: null })

  const active = enabled && Boolean(scheduleId && subjectId && date)
  // Una clave por combinación de filtros: si cambia, se vuelve a pedir
  const requestKey = `${scheduleId}:${subjectId}:${date}:${reloadKey}`

  useEffect(() => {
    if (!active) return
    const controller = new AbortController()
    intensificationAttendanceService
      .get({ scheduleId, subjectId, date }, controller.signal)
      .then((data) => setState({ key: requestKey, data, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return // El pedido viejo se canceló: no es un error
        setState({
          key: requestKey,
          data: null,
          error: err instanceof Error ? err.message : 'No se pudo cargar la asistencia.',
        })
      })
    return () => controller.abort()
  }, [active, scheduleId, subjectId, date, requestKey])

  // Está cargando mientras la respuesta guardada no sea la de los filtros actuales
  const loading = active && state.key !== requestKey

  return {
    data: active && !loading ? state.data : null,
    loading,
    // Con error no se muestran datos viejos como si fueran actuales
    error: active && !loading ? state.error : null,
    reload: () => setReloadKey((key) => key + 1),
  }
}
