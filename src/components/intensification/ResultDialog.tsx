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

import { AttachmentPicker } from '@/components/common/AttachmentPicker'
import {
  getAttachmentErrorMessage,
  validateAttachmentFiles,
} from '@/components/common/attachmentRules'
import { RESULT_LABELS } from '@/components/intensification/intensificationLabels'
import {
  intensificationService,
  type IntensificationAssignment,
  type ResultCode,
} from '@/services/intensification.service'

interface ResultDialogProps {
  open: boolean
  assignment: IntensificationAssignment | null
  onClose: () => void
  onSaved: (message: string) => void
}

// Fecha de hoy en formato AAAA-MM-DD, con la hora local
const todayIso = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

// Carga del resultado de la intensificación (E3-RF-08).
// AA: nota obligatoria de 4 a 10, y la materia queda acreditada.
// CCA (continúa con avances) o CSA (continúa sin avances): nota opcional de 1 a 3,
// y la materia sigue pendiente.
export const ResultDialog = ({ open, assignment, onClose, onSaved }: ResultDialogProps) => {
  const today = todayIso()
  const [resultCode, setResultCode] = useState<ResultCode | ''>('')
  const [score, setScore] = useState('')
  const [evaluationDate, setEvaluationDate] = useState(today)
  const [knowledgeAtClose, setKnowledgeAtClose] = useState('')
  const [pendingKnowledge, setPendingKnowledge] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Evidencias (CRM-060): se suben después de guardar el resultado, porque van al intento
  const [files, setFiles] = useState<File[]>([])
  // Si el resultado se guardó pero falló la subida, al reintentar solo se suben los archivos:
  // volver a mandar el resultado daría error (con AA ya no se cambia)
  const [resultSaved, setResultSaved] = useState(false)

  // Al abrir, se cargan los datos que ya tenga (por ejemplo, un CCA anterior)
  useEffect(() => {
    if (!open || !assignment) return
    setResultCode(assignment.resultCode ?? '')
    setScore(assignment.score !== null ? String(assignment.score) : '')
    setEvaluationDate(assignment.evaluationDate?.slice(0, 10) ?? todayIso())
    setKnowledgeAtClose(assignment.knowledgeAtClose ?? '')
    setPendingKnowledge(assignment.pendingKnowledge ?? '')
    setError(null)
    setFiles([])
    setResultSaved(false)
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

  // La fecha del examen es obligatoria y no puede ser futura (el back controla además el inicio del período)
  const dateError = !evaluationDate
    ? 'Elegí la fecha de evaluación.'
    : evaluationDate > today
      ? 'La fecha de evaluación no puede ser futura.'
      : null

  const filesError = validateAttachmentFiles(files).join(' ') || undefined
  const canSave =
    (resultSaved || (Boolean(resultCode) && !scoreError && !dateError)) && !filesError && !saving

  const resultMessage = approved
    ? 'Resultado guardado: la materia quedó acreditada.'
    : 'Resultado guardado: la materia sigue en intensificación.'

  // Si el resultado ya quedó guardado, la lista de asignaciones tiene que actualizarse igual
  function handleClose() {
    if (saving) return
    if (resultSaved) onSaved(`${resultMessage} Las evidencias no se subieron.`)
    onClose()
  }

  async function handleSave() {
    if (!assignment || !resultCode) return
    setSaving(true)
    setError(null)
    try {
      if (!resultSaved) {
        await intensificationService.registerResult(assignment.id, {
          resultCode,
          score: scoreValue,
          evaluationDate,
          knowledgeAtClose: knowledgeAtClose.trim() || null,
          ...(!approved && { pendingKnowledge: pendingKnowledge.trim() || null }),
        })
        setResultSaved(true)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el resultado.')
      setSaving(false)
      return
    }

    if (files.length > 0) {
      try {
        await intensificationService.uploadAttachments(assignment.id, files)
      } catch (err: unknown) {
        setError(
          `El resultado se guardó, pero no se pudieron subir las evidencias. ${getAttachmentErrorMessage(err, '')}`.trim()
        )
        setSaving(false)
        return
      }
    }

    setSaving(false)
    const evidence =
      files.length === 0
        ? ''
        : files.length === 1
          ? ' Se adjuntó 1 evidencia.'
          : ` Se adjuntaron ${files.length} evidencias.`
    onSaved(`${resultMessage}${evidence}`)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Resultado · {assignment?.student.lastName}, {assignment?.student.firstName}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {assignment?.subject.name} · {assignment?.subject.gradeLevel}° año
          </Typography>

          <TextField
            select
            label="Resultado"
            size="small"
            value={resultCode}
            onChange={(event) => setResultCode(event.target.value as ResultCode)}
            disabled={resultSaved}
          >
            {(Object.keys(RESULT_LABELS) as ResultCode[]).map((code) => (
              <MenuItem key={code} value={code}>
                {RESULT_LABELS[code]}
              </MenuItem>
            ))}
          </TextField>

          <Stack direction="row" spacing={2}>
            <TextField
              label={approved ? 'Nota (4 a 10)' : 'Nota (opcional, 1 a 3)'}
              size="small"
              value={score}
              onChange={(event) => setScore(event.target.value)}
              disabled={!resultCode || resultSaved}
              error={Boolean(scoreError)}
              helperText={scoreError ?? ' '}
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 2 } }}
              sx={{ maxWidth: 220 }}
            />

            {/* Fecha del examen: por defecto hoy, se puede cambiar si se carga días después */}
            <TextField
              type="date"
              label="Fecha de evaluación"
              size="small"
              value={evaluationDate}
              onChange={(event) => setEvaluationDate(event.target.value)}
              disabled={resultSaved}
              error={Boolean(dateError)}
              helperText={dateError ?? ' '}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }}
              sx={{ minWidth: 180 }}
            />
          </Stack>

          <TextField
            label="Logros o saberes alcanzados"
            size="small"
            multiline
            minRows={2}
            value={knowledgeAtClose}
            onChange={(event) => setKnowledgeAtClose(event.target.value.slice(0, 2000))}
            disabled={resultSaved}
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
              disabled={resultSaved}
            />
          )}

          {/* Evidencias del intento: trabajos prácticos, evaluaciones (CRM-060) */}
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">Evidencias (opcional)</Typography>
            <AttachmentPicker
              files={files}
              onChange={setFiles}
              disabled={saving}
              error={filesError}
              checkPdfs
              allowMergePhotos
            />
          </Stack>

          {approved && !resultSaved && (
            <Alert severity="info">
              La materia queda acreditada y sale de las materias pendientes. Después de guardar, el
              resultado no se puede cambiar.
            </Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={saving}>
          {resultSaved ? 'Cerrar' : 'Cancelar'}
        </Button>
        <Button
          variant="contained"
          disabled={!canSave}
          onClick={() => void handleSave()}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? 'Guardando...' : resultSaved ? 'Reintentar subida' : 'Guardar resultado'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ResultDialog
