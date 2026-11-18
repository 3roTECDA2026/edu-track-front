import { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'

import { AttachmentPicker } from '@/components/common/AttachmentPicker'
import {
  getAttachmentErrorMessage,
  validateAttachmentFiles,
} from '@/components/common/attachmentRules'
import { InterventionAttachments } from '@/components/interventions/InterventionAttachments'
import {
  ATTACHMENT_WINDOW_HOURS,
  EVENT_TYPE_CONFIG,
  canAddAttachments,
} from '@/components/interventions/interventionTimelineConfig'
import { useNotify } from '@/components/layout/NotificationProvider'
import { SoftBadge } from '@/components/studentProfile/SoftBadge'
import { formatDate } from '@/components/studentProfile/profileLabels'
import { COLORS, labelSx } from '@/components/studentProfile/profileStyles'
import { getSessionUser } from '@/services/session'
import {
  uploadInterventionAttachments,
  type InterventionListItem,
} from '@/services/interventions.service'

interface InterventionDetailDialogProps {
  intervention: InterventionListItem | null
  onClose: () => void
  // Se avisa después de subir archivos, para actualizar la cantidad en la línea de tiempo
  onAttachmentsAdded: () => void
}

// Bloque etiqueta + texto; no se muestra si el campo viene vacío.
const Field = ({ label, value }: { label: string; value: string | null }) => {
  if (!value) return null
  return (
    <Box>
      <Typography sx={{ ...labelSx, mb: 0.25 }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: COLORS.ink, whiteSpace: 'pre-wrap' }}>
        {value}
      </Typography>
    </Box>
  )
}

// Detalle de una intervención (CRM-088, criterio 2): todos sus datos y sus adjuntos.
// El autor, dentro de las 48 hs, puede sumar archivos (la evidencia a veces llega después).
export const InterventionDetailDialog = ({
  intervention,
  onClose,
  onAttachmentsAdded,
}: InterventionDetailDialogProps) => {
  const notify = useNotify()
  const [files, setFiles] = useState<File[]>([])
  const [filesError, setFilesError] = useState<string | undefined>()
  const [uploading, setUploading] = useState(false)
  const [pickerBusy, setPickerBusy] = useState(false)
  // Cambia después de subir, para volver a pedir la lista de adjuntos
  const [attachmentsVersion, setAttachmentsVersion] = useState(0)

  if (!intervention) return null

  const type = EVENT_TYPE_CONFIG[intervention.eventType]
  const section = intervention.classSection
  const canUpload = canAddAttachments(intervention, getSessionUser()?.id)

  const handleUpload = async () => {
    const errors = validateAttachmentFiles(files)
    if (errors.length > 0) {
      setFilesError(errors.join(' '))
      return
    }
    setFilesError(undefined)
    setUploading(true)
    try {
      await uploadInterventionAttachments(intervention.id, files)
      notify.success(files.length === 1 ? 'Archivo adjuntado.' : 'Archivos adjuntados.')
      setFiles([])
      setAttachmentsVersion((v) => v + 1)
      onAttachmentsAdded()
    } catch (err: unknown) {
      notify.error(getAttachmentErrorMessage(err, 'No se pudieron subir los archivos.'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open onClose={uploading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Intervención del {formatDate(intervention.date)}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            <SoftBadge label={type.label} color={type.color} background={type.background} />
            {section && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Curso: {section.grade}° {section.division}
              </Typography>
            )}
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Registró: {intervention.author.lastName}, {intervention.author.firstName}
          </Typography>

          <Field label="Situación detectada" value={intervention.description} />
          <Field label="Propuesta de intervención" value={intervention.interventionProposal} />
          <Field label="Actores involucrados" value={intervention.involvedActors} />

          <Divider />

          <Box>
            <Typography sx={{ ...labelSx, mb: 0.5 }}>Adjuntos</Typography>
            <InterventionAttachments
              key={attachmentsVersion}
              interventionId={intervention.id}
              allowPreview
            />
          </Box>

          {canUpload && (
            <Box>
              <Typography sx={{ ...labelSx, mb: 1 }}>
                Sumar archivos (podés hacerlo durante {ATTACHMENT_WINDOW_HOURS} hs desde el
                registro)
              </Typography>
              <AttachmentPicker
                files={files}
                onChange={(next) => {
                  setFiles(next)
                  setFilesError(undefined)
                }}
                disabled={uploading}
                error={filesError}
                onBusyChange={setPickerBusy}
              />
              {files.length > 0 && (
                <Button
                  variant="contained"
                  startIcon={<FileUploadOutlinedIcon />}
                  onClick={handleUpload}
                  disabled={uploading || pickerBusy}
                  sx={{ mt: 2, textTransform: 'none' }}
                >
                  {uploading ? 'Subiendo…' : 'Subir archivos'}
                </Button>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={uploading}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default InterventionDetailDialog
