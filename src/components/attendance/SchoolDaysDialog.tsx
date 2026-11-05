import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { attendanceService, type SchoolDays } from '@/services/attendance.service'

interface SchoolDaysDialogProps {
  open: boolean
  year: number
  onClose: () => void
  // Se avisa a la pantalla para que recargue el resumen con los días nuevos
  onSaved: (message: string) => void
}

type Field = 'term1SchoolDays' | 'term2SchoolDays' | 'totalSchoolDays'

const toInput = (value: number | null) => (value === null ? '' : String(value))
const toValue = (value: string) => (value.trim() === '' ? null : Number(value))

// Modal para cargar los días hábiles del ciclo lectivo: por cuatrimestre y el total.
// Los usan el resumen de asistencia y el RITE.
export const SchoolDaysDialog = ({ open, year, onClose, onSaved }: SchoolDaysDialogProps) => {
  const [values, setValues] = useState<Record<Field, string>>({
    term1SchoolDays: '',
    term2SchoolDays: '',
    totalSchoolDays: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Al abrir, se traen los días que ya estén cargados
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    attendanceService
      .getSchoolDays(year, controller.signal)
      .then((data) =>
        setValues({
          term1SchoolDays: toInput(data.term1SchoolDays),
          term2SchoolDays: toInput(data.term2SchoolDays),
          totalSchoolDays: toInput(data.totalSchoolDays),
        })
      )
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los días hábiles')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [open, year])

  // Solo números enteros entre 0 y 366 (o vacío)
  const invalid = (Object.values(values) as string[]).some(
    (value) => value.trim() !== '' && (!/^\d{1,3}$/.test(value) || Number(value) > 366)
  )

  const term1 = toValue(values.term1SchoolDays)
  const term2 = toValue(values.term2SchoolDays)
  const total = toValue(values.totalSchoolDays)
  const sum = term1 !== null && term2 !== null ? term1 + term2 : null
  // El total puede ser distinto a la suma (por ejemplo, si el ciclo tiene días fuera de los cuatrimestres)
  const differs = sum !== null && total !== null && sum !== total

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const data: SchoolDays = { year, term1SchoolDays: term1, term2SchoolDays: term2, totalSchoolDays: total }
      await attendanceService.saveSchoolDays(data)
      onSaved('Días hábiles guardados.')
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los días hábiles')
    } finally {
      setSaving(false)
    }
  }

  const field = (key: Field, label: string) => (
    <TextField
      label={label}
      size="small"
      value={values[key]}
      onChange={(event) => setValues((prev) => ({ ...prev, [key]: event.target.value }))}
      slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 3 } }}
      fullWidth
    />
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Días hábiles · Ciclo {year}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Stack sx={{ alignItems: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Cantidad de días de clase. Se usan para el porcentaje de asistencia y el RITE.
            </Typography>
            {field('term1SchoolDays', '1° cuatrimestre')}
            {field('term2SchoolDays', '2° cuatrimestre')}
            {field('totalSchoolDays', 'Total del ciclo')}
            {sum !== null && (
              <Typography variant="caption" sx={{ color: differs ? '#b45309' : '#6b7280' }}>
                Suma de los cuatrimestres: {sum}
                {differs ? ' · El total cargado es distinto a la suma.' : ''}
              </Typography>
            )}
            {invalid && (
              <Typography variant="caption" sx={{ color: '#dc2626' }}>
                Cargá números enteros entre 0 y 366.
              </Typography>
            )}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={loading || saving || invalid}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SchoolDaysDialog