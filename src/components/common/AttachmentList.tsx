import { useState, type ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'

import {
  formatFileSize,
  getAttachmentErrorMessage,
  isImageFile,
} from '@/components/common/attachmentRules'
import { useNotify } from '@/components/layout/NotificationProvider'
import { useLazyResource } from '@/hooks/useLazyResource'
import { openBlob, saveBlob } from '@/utils/saveBlob'

// Lo mínimo que se necesita de un adjunto para listarlo
export interface AttachmentItem {
  id: string
  originalName: string
  mimeType: string
  size: number
}

interface AttachmentListProps<T extends AttachmentItem> {
  // Clave del recurso: cambia si cambia de qué registro son los adjuntos
  resourceKey: string
  load: (signal: AbortSignal) => Promise<T[]>
  download: (attachment: T) => Promise<Blob>
  openLabel?: ReactNode // Texto del botón que muestra la lista
  emptyText?: string
  // "Ver": abre PDF e imágenes en una pestaña nueva, con el visor del navegador
  allowPreview?: boolean
  // Si viene, muestra "Quitar" con confirmación (por ejemplo, solo para dirección)
  onDelete?: (attachment: T) => Promise<void>
}

function AttachmentIcon({ mimeType }: { mimeType: string }) {
  if (isImageFile(mimeType)) return <ImageOutlinedIcon fontSize="small" />
  if (mimeType === 'application/pdf') return <PictureAsPdfOutlinedIcon fontSize="small" />
  return <DescriptionOutlinedIcon fontSize="small" />
}

const canPreview = (mimeType: string) => mimeType === 'application/pdf' || isImageFile(mimeType)

// Lista de adjuntos con descarga (CRM-087 y CRM-060). Se piden recién al tocar el botón, para no
// hacer un pedido por cada registro apenas se abre la pantalla.
export function AttachmentList<T extends AttachmentItem>({
  resourceKey,
  load,
  download,
  openLabel = 'Ver adjuntos',
  emptyText = 'No tiene adjuntos.',
  allowPreview = false,
  onDelete,
}: AttachmentListProps<T>) {
  const notify = useNotify()
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<T | null>(null)
  const [deleting, setDeleting] = useState(false)

  const attachments = useLazyResource(open ? resourceKey : null, load)

  const withFile = async (attachment: T, action: (blob: Blob) => void, fallback: string) => {
    setBusyId(attachment.id)
    try {
      action(await download(attachment))
    } catch (err: unknown) {
      notify.error(getAttachmentErrorMessage(err, fallback))
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete || !onDelete) return
    setDeleting(true)
    try {
      await onDelete(toDelete)
      notify.success(`Se quitó "${toDelete.originalName}"`)
      setToDelete(null)
      attachments.reload()
    } catch (err: unknown) {
      notify.error(getAttachmentErrorMessage(err, 'No se pudo quitar el archivo.'))
    } finally {
      setDeleting(false)
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
          {openLabel}
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
        {emptyText}
      </Typography>
    )
  }

  return (
    <>
      <Stack spacing={0.5}>
        {items.map((attachment) => {
          const busy = busyId === attachment.id
          return (
            <Stack
              key={attachment.id}
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', color: 'text.secondary' }}
            >
              <AttachmentIcon mimeType={attachment.mimeType} />
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
              {allowPreview && canPreview(attachment.mimeType) && (
                <Tooltip title="Ver">
                  <span>
                    <IconButton
                      size="small"
                      aria-label={`Ver ${attachment.originalName}`}
                      onClick={() => withFile(attachment, openBlob, 'No se pudo abrir el archivo.')}
                      disabled={busy}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              <Tooltip title="Descargar">
                <span>
                  <IconButton
                    size="small"
                    aria-label={`Descargar ${attachment.originalName}`}
                    onClick={() =>
                      withFile(
                        attachment,
                        (blob) => saveBlob(blob, attachment.originalName),
                        'No se pudo descargar el archivo.'
                      )
                    }
                    disabled={busy}
                  >
                    {busy ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <FileDownloadOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              {onDelete && (
                <Tooltip title="Quitar">
                  <span>
                    <IconButton
                      size="small"
                      aria-label={`Quitar ${attachment.originalName}`}
                      onClick={() => setToDelete(attachment)}
                      disabled={busy}
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Stack>
          )
        })}
      </Stack>

      <Dialog
        open={toDelete !== null}
        onClose={deleting ? undefined : () => setToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>¿Quitar "{toDelete?.originalName}"?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Deja de aparecer en la lista. Queda registrado quién lo quitó y cuándo, y el archivo se
            conserva.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setToDelete(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void confirmDelete()}
            disabled={deleting}
          >
            {deleting ? 'Quitando…' : 'Quitar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AttachmentList
