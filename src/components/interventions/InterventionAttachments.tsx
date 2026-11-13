import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'

import {
  formatFileSize,
  getAttachmentErrorMessage,
  isImageFile,
} from '@/components/interventions/attachmentRules'
import { useNotify } from '@/components/layout/NotificationProvider'
import { useLazyResource } from '@/hooks/useLazyResource'
import {
  downloadInterventionAttachment,
  listInterventionAttachments,
  type InterventionAttachment,
} from '@/services/interventions.service'
import { saveBlob } from '@/utils/saveBlob'

interface InterventionAttachmentsProps {
  interventionId: string
}

function AttachmentIcon({ attachment }: { attachment: InterventionAttachment }) {
  if (isImageFile(attachment.mimeType)) return <ImageOutlinedIcon fontSize="small" />
  if (attachment.mimeType === 'application/pdf')
    return <PictureAsPdfOutlinedIcon fontSize="small" />
  return <DescriptionOutlinedIcon fontSize="small" />
}

// Adjuntos de una intervención, con opción de descargarlos (CRM-087, criterio 5).
// Se piden recién al tocar "Ver adjuntos", para no hacer un pedido por cada intervención
// de la lista apenas se abre la pestaña.
export const InterventionAttachments = ({ interventionId }: InterventionAttachmentsProps) => {
  const notify = useNotify()
  const [open, setOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const attachments = useLazyResource(open ? `attachments:${interventionId}` : null, (signal) =>
    listInterventionAttachments(interventionId, signal)
  )

  const handleDownload = async (attachment: InterventionAttachment) => {
    setDownloadingId(attachment.id)
    try {
      const blob = await downloadInterventionAttachment(interventionId, attachment.id)
      saveBlob(blob, attachment.originalName)
    } catch (err: unknown) {
      notify.error(getAttachmentErrorMessage(err, 'No se pudo descargar el archivo.'))
    } finally {
      setDownloadingId(null)
    }
  }

  if (!open) {
    return (
      <Box>
        <Button
          size="small"
          color="inherit"
          startIcon={<AttachFileIcon />}
          onClick={() => setOpen(true)}
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          Ver adjuntos
        </Button>
      </Box>
    )
  }

  if (attachments.loading && !attachments.data) {
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
        <CircularProgress size={16} color="inherit" />
        <Typography variant="body2">Cargando adjuntos…</Typography>
      </Stack>
    )
  }

  if (attachments.error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={attachments.reload}>
            Reintentar
          </Button>
        }
      >
        No se pudieron cargar los adjuntos. {attachments.error}
      </Alert>
    )
  }

  const items = attachments.data ?? []

  if (items.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Esta intervención no tiene adjuntos.
      </Typography>
    )
  }

  return (
    <Stack spacing={0.5}>
      {items.map((attachment) => (
        <Stack
          key={attachment.id}
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', color: 'text.secondary' }}
        >
          <AttachmentIcon attachment={attachment} />
          <Typography
            variant="body2"
            noWrap
            title={attachment.originalName}
            sx={{ color: 'text.primary', minWidth: 0 }}
          >
            {attachment.originalName}
          </Typography>
          <Typography variant="caption" sx={{ flexShrink: 0 }}>
            {formatFileSize(attachment.size)}
          </Typography>
          <Tooltip title="Descargar">
            <span>
              <IconButton
                size="small"
                aria-label={`Descargar ${attachment.originalName}`}
                onClick={() => handleDownload(attachment)}
                disabled={downloadingId === attachment.id}
              >
                {downloadingId === attachment.id ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <FileDownloadOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ))}
    </Stack>
  )
}

export default InterventionAttachments
