import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  CircularProgress,
  Typography,
} from '@mui/material'
import type { PateEvaluation } from '@/services/pate.service'
import { EVALUATION_LABELS } from '@/components/pate/pateLabels'

interface ClosePateDialogProps {
  open: boolean
  submitting: boolean
  onClose: () => void
  onSubmit: (data: { finalEvaluation: PateEvaluation; finalObservations?: string }) => Promise<void>
}

export const ClosePateDialog: React.FC<ClosePateDialogProps> = ({
  open,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [evaluation, setEvaluation] = useState<PateEvaluation | ''>('')
  const [observations, setObservations] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setEvaluation('')
    setObservations('')
    setError(null)
  }

  const handleClose = () => {
    if (submitting) return
    reset()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!evaluation) {
      setError('Elegí la evaluación final de resultados.')
      return
    }
    try {
      setError(null)
      await onSubmit({
        finalEvaluation: evaluation,
        finalObservations: observations.trim() || undefined,
      })
      reset()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cerrar el PATE.'
      setError(msg)
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Cerrar Plan de Acompañamiento (PATE)</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              Al cerrar el PATE, se registra la evaluación final de resultados y no se podrán
              agregar nuevos seguimientos.
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <FormControl fullWidth size="small">
              <InputLabel id="close-eval-label">Evaluación Final de Resultados</InputLabel>
              <Select
                labelId="close-eval-label"
                value={evaluation}
                label="Evaluación Final de Resultados"
                onChange={(e) => setEvaluation(e.target.value as PateEvaluation)}
              >
                <MenuItem value="">
                  <em>Seleccionar evaluación...</em>
                </MenuItem>
                <MenuItem value="FAVORABLE">{EVALUATION_LABELS.FAVORABLE}</MenuItem>
                <MenuItem value="PARTIAL">{EVALUATION_LABELS.PARTIAL}</MenuItem>
                <MenuItem value="UNFAVORABLE">{EVALUATION_LABELS.UNFAVORABLE}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Observaciones y Conclusiones Finales"
              multiline
              rows={4}
              fullWidth
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Detallá los resultados pedagógicos obtenidos al término del plan..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {submitting ? 'Cerrando...' : 'Confirmar Cierre'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
