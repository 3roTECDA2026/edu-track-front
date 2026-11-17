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
import {
  formatMeetingDate,
  MEETING_PERIOD_LABELS,
  MEETING_STATUS_CONFIG,
} from '@/components/edte/edteLabels'
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
  const [evaluation, setEvaluation] = useState<PateEvaluation | ''>('')
  const [observations, setObservations] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setMeetingId('')
    setProgress('')
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
    if (!meetingId) {
      setError('Elegí la reunión del EDTE asociada al seguimiento.')
      return
    }
    if (!evaluation) {
      setError('Elegí la evaluación de resultados.')
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
      reset()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el seguimiento.'
      setError(msg)
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Agregar Seguimiento del PATE</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}

            {meetings.length === 0 && (
              <Alert severity="info">
                No hay reuniones disponibles para registrar un seguimiento de este alumno.
              </Alert>
            )}

            <FormControl fullWidth size="small">
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
                    {formatMeetingDate(m.date)} — Período:{' '}
                    {MEETING_PERIOD_LABELS[m.period] ?? m.period} (Ciclo {m.year}) ·{' '}
                    {MEETING_STATUS_CONFIG[m.status].label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="followup-eval-label">Evaluación de Resultados</InputLabel>
              <Select
                labelId="followup-eval-label"
                value={evaluation}
                label="Evaluación de Resultados"
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
              label="Avances Observados"
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
          <Button onClick={handleClose} disabled={submitting}>
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
