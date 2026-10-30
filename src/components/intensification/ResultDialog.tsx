import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import {
  intensificationService,
  RESULT_LABELS,
  type IntensificationAssignment,
  type ResultCode,
} from '@/services/intensification.service'

interface ResultDialogProps {
  open: boolean
  assignment: IntensificationAssignment | null
  onClose: () => void
  onSaved: (message: string) => void
}

// Carga del resultado de la intensificación (E3-RF-08).
// AA: nota obligatoria de 4 a 10, y la materia queda acreditada.
// CCA o CSA: nota opcional de 1 a 3, y la materia sigue pendiente.
export const ResultDialog = ({ open, assignment, onClose, onSaved }: ResultDialogProps) => {
  const [resultCode, setResultCode] = useState<ResultCode | ''>('')
  const [score, setScore] = useState('')
  const [knowledgeAtClose, setKnowledgeAtClose] = useState('')
  const [pendingKnowledge, setPendingKnowledge] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Al abrir, se cargan los datos que ya tenga (por ejemplo, un CCA anterior)
  useEffect(() => {
    if (!open || !assignment) return
    setResultCode(assignment.resultCode ?? '')
    setScore(assignment.score !== null ? String(assignment.score) : '')
    setKnowledgeAtClose(assignment.knowledgeAtClose ?? '')
    setPendingKnowledge(assignment.pendingKnowledge ?? '')
    setError(null)
  }, [open, assignment])

  const approved = resultCode === 'AA'
  const scoreValue = score.trim() === '' ? null : Number(score)

  // Las mismas reglas que valida el back
  const scoreError = (() => {
    if (!resultCode) return null
    if (score.trim() !== '' && !/^\d{1,2}$/.test(score.trim())) return 'Ingresá un número entero.'
    if (approved && (scoreValue === null || scoreValue < 4 || scoreValue > 10)) {
      return 'Con AA, la nota va de 4 a 10.'
    }
    if (!approved && scoreValue !== null && (scoreValue < 1 || scoreValue > 3)) {
      return 'Con CCA o CSA, la nota va de 1 a 3, o queda vacía.'
    }
    return null
  })()

  const canSave = Boolean(resultCode) && !scoreError && !saving

  async function handleSave() {
    if (!assignment || !resultCode) return
    setSaving(true)
    setError(null)
    try {
      await intensificationService.registerResult(assignment.id, {
        resultCode,
        score: scoreValue,
        knowledgeAtClose: knowledgeAtClose.trim() || null,
        ...(!approved && { pendingKnowledge: pendingKnowledge.trim() || null }),
      })
      onSaved(
        approved
          ? 'Resultado guardado: la materia quedó acreditada.'
          : 'Resultado guardado: la materia sigue en intensificación.'
      )
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el resultado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Resultado · {assignment?.student.lastName}, {assignment?.student.firstName}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            {assignment?.subject.name} · {assignment?.subject.gradeLevel}° año
          </Typography>

          <TextField
            select
            label="Resultado"
            size="small"
            value={resultCode}
            onChange={(event) => setResultCode(event.target.value as ResultCode)}
          >
            {(Object.keys(RESULT_LABELS) as ResultCode[]).map((code) => (
              <MenuItem key={code} value={code}>
                {RESULT_LABELS[code]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label={approved ? 'Nota (4 a 10)' : 'Nota (opcional, 1 a 3)'}
            size="small"
            value={score}
            onChange={(event) => setScore(event.target.value)}
            disabled={!resultCode}
            error={Boolean(scoreError)}
            helperText={scoreError ?? ' '}
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 2 } }}
            sx={{ maxWidth: 220 }}
          />

          <TextField
            label="Logros o saberes alcanzados"
            size="small"
            multiline
            minRows={2}
            value={knowledgeAtClose}
            onChange={(event) => setKnowledgeAtClose(event.target.value.slice(0, 2000))}
          />

          {/* Con CCA o CSA, la materia sigue: se actualizan los saberes que le quedan */}
          {resultCode && !approved && (
            <TextField
              label="Saberes que le quedan pendientes"
              size="small"
              multiline
              minRows={2}
              value={pendingKnowledge}
              onChange={(event) => setPendingKnowledge(event.target.value.slice(0, 2000))}
            />
          )}

          {approved && (
            <Alert severity="info">
              La materia queda acreditada y sale de las materias pendientes. Después de guardar, el
              resultado no se puede cambiar.
            </Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!canSave}
          onClick={() => void handleSave()}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Guardar resultado
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ResultDialog
