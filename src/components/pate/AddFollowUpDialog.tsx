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
} from '@mui/material'
import type { EdteMeetingSummary } from '@/services/edteMeeting.service'
import type { PateEvaluation } from '@/services/pate.service'
import { EVALUATION_LABELS } from '@/components/pate/pateLabels'

interface AddFollowUpDialogProps {
  open: boolean
  meetings: EdteMeetingSummary[]
  submitting: boolean
  onClose: () => void
  onSubmit: (data: {
    edteMeetingId: string
    progress: string
    evaluation: PateEvaluation
    observations?: string
  }) => Promise<void>
}

export const AddFollowUpDialog: React.FC<AddFollowUpDialogProps> = ({
  open,
  meetings,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [meetingId, setMeetingId] = useState('')
  const [progress, setProgress] = useState('')
  const [evaluation, setEvaluation] = useState<PateEvaluation>('PARTIAL')
  const [observations, setObservations] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meetingId) {
      setError('Elegí la reunión del EDTE asociada al seguimiento.')
      return
    }
    if (!progress.trim()) {
      setError('Ingresá los avances observados.')
      return
    }

    try {
      setError(null)
      await onSubmit({
        edteMeetingId: meetingId,
        progress: progress.trim(),
        evaluation,
        observations: observations.trim() || undefined,
      })
      // Reset form
      setMeetingId('')
      setProgress('')
      setEvaluation('PARTIAL')
      setObservations('')
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el seguimiento.')
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Agregar Seguimiento del PATE</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}

            <FormControl fullWidth required size="small">
              <InputLabel id="followup-meeting-label">Reunión del EDTE</InputLabel>
              <Select
                labelId="followup-meeting-label"
                value={meetingId}
                label="Reunión del EDTE"
                onChange={(e) => setMeetingId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Seleccionar reunión...</em>
                </MenuItem>
                {meetings.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.date} — Período: {m.period} (Ciclo {m.year})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required size="small">
              <InputLabel id="followup-eval-label">Evaluación de Resultados</InputLabel>
              <Select
                labelId="followup-eval-label"
                value={evaluation}
                label="Evaluación de Resultados"
                onChange={(e) => setEvaluation(e.target.value as PateEvaluation)}
              >
                <MenuItem value="FAVORABLE">{EVALUATION_LABELS.FAVORABLE}</MenuItem>
                <MenuItem value="PARTIAL">{EVALUATION_LABELS.PARTIAL}</MenuItem>
                <MenuItem value="UNFAVORABLE">{EVALUATION_LABELS.UNFAVORABLE}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Avances Observados"
              required
              multiline
              rows={3}
              fullWidth
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              placeholder="Detallá los avances pedagógicos, cumplimientos y desempeño del alumno..."
            />

            <TextField
              label="Observaciones (Opcional)"
              multiline
              rows={2}
              fullWidth
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Acuerdos adicionales, dificultades persistentes o sugerencias..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {submitting ? 'Guardando...' : 'Guardar Seguimiento'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
