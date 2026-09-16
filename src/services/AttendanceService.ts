import { fetchApi } from './api'

export type EstadoAsistencia = 'Presente' | 'Ausente' | 'Media falta' | 'Cuarto falta'

export type AttendanceRecord = {
  legajo: string
  fecha: string
  estado: EstadoAsistencia
  section: string
}

// TODO: ajustar estructura cuando el backend defina el contrato de /attendance/batch
export async function postAttendanceBatch(records: AttendanceRecord[]): Promise<void> {
  await fetchApi('/attendance/batch', {
    method: 'POST',
    body: JSON.stringify({ records }),
  })
}