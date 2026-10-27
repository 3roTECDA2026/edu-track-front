import { useEffect, useState } from 'react'
import {
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

interface PeriodDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  periodLabel: string
  initialStart: string
  initialEnd: string
  saving: boolean
  onClose: () => void
  onSubmit: (startDate: string, endDate: string) => void
}

// Modal para configurar las fechas de un período de intensificación
export const PeriodDialog = ({
  open,
  mode,
  periodLabel,
  initialStart,
  initialEnd,
  saving,
  onClose,
  onSubmit,
}: PeriodDialogProps) => {
  const [startDate, setStartDate] = useState(initialStart)
  const [endDate, setEndDate] = useState(initialEnd)

  useEffect(() => {
    if (open) {
      setStartDate(initialStart)
      setEndDate(initialEnd)
    }
  }, [open, initialStart, initialEnd])

  const invalidRange = Boolean(startDate && endDate && endDate < startDate)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {mode === 'create' ? 'Configurar período' : 'Editar fechas'} · {periodLabel}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            type="date"
            label="Inicio"
            size="small"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date"
            label="Fin"
            size="small"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            error={invalidRange}
            helperText={invalidRange ? 'La fecha de fin no puede ser anterior a la de inicio' : ' '}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {mode === 'create' && (
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Después vas a poder sumar las materias y sus docentes.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled={!startDate || !endDate || invalidRange || saving}
          onClick={() => onSubmit(startDate, endDate)}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ backgroundColor: '#111827', '&:hover': { backgroundColor: '#1f2937' } }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PeriodDialog
