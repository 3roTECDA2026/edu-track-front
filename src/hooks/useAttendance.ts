import { useCallback, useState } from 'react'

import {
  attendanceService,
  type AttendanceEntry,
  type AttendanceStudent,
  type AttendanceSummaryItem,
  type DailyAttendanceRecord,
} from '@/services/attendance.service'

export const useAttendance = (sectionId: string) => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [students, setStudents] = useState<AttendanceStudent[]>([])
  const [records, setRecords] = useState<DailyAttendanceRecord[]>([])
  const [summary, setSummary] = useState<AttendanceSummaryItem[]>([])

  // Trae los alumnos de la sección y la asistencia ya cargada en esa fecha
  const fetchAttendanceByDate = useCallback(
    async (date: string) => {
      if (!sectionId) return
      setLoading(true)
      setError(null)
      try {
        const data = await attendanceService.getBySectionAndDate(sectionId, date)
        setStudents(data.students)
        setRecords(data.records)
        return data
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar la asistencia')
        setStudents([])
        setRecords([])
      } finally {
        setLoading(false)
      }
    },
    [sectionId]
  )

  // Guarda (o actualiza) la asistencia del día y vuelve a consultarla para quedar sincronizados
  const submitBatchAttendance = useCallback(
    async (date: string, entries: AttendanceEntry[]) => {
      if (!sectionId) return
      setSaving(true)
      setError(null)
      try {
        const response = await attendanceService.saveBatch(sectionId, date, entries)
        await fetchAttendanceByDate(date)
        return response
      } catch (err: unknown) {
        throw new Error(err instanceof Error ? err.message : 'Error al guardar la asistencia')
      } finally {
        setSaving(false)
      }
    },
    [sectionId, fetchAttendanceByDate]
  )

  // Resumen de asistencia de la sección
  // TODO (CRM-047): recibir filtros y paginación para la pantalla de resumen
  const fetchSummary = useCallback(async () => {
    if (!sectionId) return
    setLoading(true)
    setError(null)
    try {
      const query = new URLSearchParams({ sectionId, page: '1', pageSize: '100' })
      const data = await attendanceService.getSummary(query)
      setSummary(data.items)
      return data.items
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar el resumen')
    } finally {
      setLoading(false)
    }
  }, [sectionId])

  return {
    loading,
    saving,
    error,
    students,
    records,
    summary,
    fetchAttendanceByDate,
    submitBatchAttendance,
    fetchSummary,
  }
}
