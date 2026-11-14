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
  Typography,
} from '@mui/material'

import { AttachmentPicker } from '@/components/common/AttachmentPicker'
import {
  getAttachmentErrorMessage,
  validateAttachmentFiles,
} from '@/components/common/attachmentRules'
import {
  intensificationService,
  type IntensificationAssignment,
} from '@/services/intensification.service'

interface EvidenceDialogProps {
  open: boolean
  assignment: IntensificationAssignment | null
  onClose: () => void
  onSaved: (message: string) => void
}

// Adjuntar evidencias a un intento sin tocar el resultado (CRM-060). Sirve con el resultado ya
// cargado (también con AA, que no se puede volver a abrir en el diálogo del resultado), antes de
// cargarlo, o para reintentar una subida que falló y se cerró el diálogo.
export const EvidenceDialog = ({ open, assignment, onClose, onSaved }: EvidenceDialogProps) => {
  const [files, setFiles] = useState<File[]>([])
  const [pickerBusy, setPickerBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cada vez que se abre, arranca vacío
  useEffect(() => {
    if (!open) return
    setFiles([])
    setError(null)
  }, [open, assignment])

  const filesError = validateAttachmentFiles(files).join(' ') || undefined
  const canSave = files.length > 0 && !filesError && !pickerBusy && !saving

  async function handleSave() {
    if (!assignment) return
    setSaving(true)
    setError(null)
    try {
      await intensificationService.uploadAttachments(assignment.id, files)
      onSaved(
        files.length === 1 ? 'Se adjuntó 1 evidencia.' : `Se adjuntaron ${files.length} evidencias.`
      )
      onClose()
    } catch (err: unknown) {
      setError(getAttachmentErrorMessage(err, 'No se pudieron subir las evidencias.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Evidencias · {assignment?.student.lastName}, {assignment?.student.firstName}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {assignment?.subject.name} · {assignment?.subject.gradeLevel}° año. Las evidencias se
            suman al intento; el resultado no cambia.
          </Typography>
          <AttachmentPicker
            files={files}
            onChange={setFiles}
            disabled={saving}
            error={filesError}
            checkPdfs
            allowMergePhotos
            onBusyChange={setPickerBusy}
          />
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
          {saving ? 'Subiendo...' : 'Adjuntar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EvidenceDialog
