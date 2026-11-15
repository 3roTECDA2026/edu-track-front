import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import CloseIcon from '@mui/icons-material/Close'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'

import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_RULES_TEXT,
  formatFileSize,
  isImageFile,
} from '@/components/common/attachmentRules'
import { checkPdf, PDF_CHECK_MESSAGES, photosToPdf } from '@/utils/attachmentPdf'

interface AttachmentPickerProps {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
  error?: string
  // Revisa cada PDF al elegirlo (CRM-060): rechaza los dañados o protegidos y muestra sus páginas
  checkPdfs?: boolean
  // Ofrece unir dos o más fotos en un solo PDF, para trabajos en papel fotografiados (CRM-060)
  allowMergePhotos?: boolean
  // Avisa mientras revisa un PDF o une fotos: el formulario no debería guardar en ese momento
  onBusyChange?: (busy: boolean) => void
}

const fileKey = (file: File) => `${file.name}-${file.size}`
const isPdfFile = (file: File) => file.name.toLowerCase().endsWith('.pdf')

const THUMB_SIZE = 72

// Selector de archivos de evidencia (intervenciones, CRM-087; intensificación, CRM-060).
// Muestra una miniatura de cada imagen y un ícono para los documentos. Los archivos todavía no
// se subieron: se suben recién cuando se guarda el registro.
export const AttachmentPicker = ({
  files,
  onChange,
  disabled,
  error,
  checkPdfs = false,
  allowMergePhotos = false,
  onBusyChange,
}: AttachmentPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pdfPages, setPdfPages] = useState<Record<string, number>>({})
  const [rejected, setRejected] = useState<string[]>([])
  const [checking, setChecking] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeName, setMergeName] = useState('')
  const [merging, setMerging] = useState(false)
  const [mergeError, setMergeError] = useState<string | null>(null)

  const photos = files.filter((file) => isImageFile(file.name))
  const working = checking || merging
  const busy = disabled || working
  useEffect(() => {
    onBusyChange?.(working)
  }, [working, onBusyChange])

  // Link temporal para mostrar cada imagen antes de subirla. Se libera al cambiar la lista
  // o al salir de la pantalla, para no dejar memoria ocupada.
  const previews = useMemo(
    () => files.map((file) => (isImageFile(file.name) ? URL.createObjectURL(file) : null)),
    [files]
  )
  useEffect(() => () => previews.forEach((url) => url && URL.revokeObjectURL(url)), [previews])

  const handleSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    // Se suman a los ya elegidos, sin repetir el mismo archivo
    const isNew = (file: File) => !files.some((f) => fileKey(f) === fileKey(file))
    const selected = Array.from(event.target.files ?? []).filter(isNew)
    // Vaciar el input permite volver a elegir el mismo archivo si se lo quitó
    event.target.value = ''

    if (!checkPdfs) {
      onChange([...files, ...selected])
      return
    }

    // Los PDF se abren antes de sumarlos: uno dañado o protegido no se podría ver después
    setChecking(true)
    const accepted: File[] = []
    const problems: string[] = []
    const pages: Record<string, number> = {}
    for (const file of selected) {
      if (!isPdfFile(file)) {
        accepted.push(file)
        continue
      }
      const result = await checkPdf(file)
      if (result.ok) {
        accepted.push(file)
        pages[fileKey(file)] = result.pages
      } else {
        problems.push(`"${file.name}" ${PDF_CHECK_MESSAGES[result.reason]}`)
      }
    }
    setChecking(false)
    setRejected(problems)
    setPdfPages((current) => ({ ...current, ...pages }))
    onChange([...files, ...accepted])
  }

  const openMerge = () => {
    setMergeName('Fotos unidas')
    setMergeError(null)
    setMergeOpen(true)
  }

  // Reemplaza las fotos por un solo PDF, en el orden en que están en la lista
  const confirmMerge = async () => {
    setMerging(true)
    setMergeError(null)
    try {
      const pdf = await photosToPdf(photos, mergeName.trim() || 'Fotos unidas')
      setPdfPages((current) => ({ ...current, [fileKey(pdf)]: photos.length }))
      onChange([...files.filter((file) => !isImageFile(file.name)), pdf])
      setMergeOpen(false)
    } catch (err: unknown) {
      setMergeError(err instanceof Error ? err.message : 'No se pudieron unir las fotos.')
    } finally {
      setMerging(false)
    }
  }

  const removeAt = (index: number) => onChange(files.filter((_, i) => i !== index))

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        multiple
        hidden
        onChange={handleSelect}
      />

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<AttachFileIcon />}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          sx={{ textTransform: 'none' }}
        >
          Adjuntar archivos
        </Button>
        {allowMergePhotos && photos.length >= 2 && (
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<PhotoLibraryOutlinedIcon />}
            onClick={openMerge}
            disabled={busy}
            sx={{ textTransform: 'none' }}
          >
            Unir fotos en un PDF
          </Button>
        )}
        {checking && <CircularProgress size={16} color="inherit" aria-label="Revisando archivos" />}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {ATTACHMENT_RULES_TEXT}
        </Typography>
      </Stack>

      {error && (
        <Typography variant="body2" sx={{ color: 'error.main', mt: 1 }}>
          {error}
        </Typography>
      )}
      {rejected.map((message) => (
        <Typography key={message} variant="body2" sx={{ color: 'error.main', mt: 1 }}>
          No se agregó {message}
        </Typography>
      ))}

      {files.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
          {files.map((file, index) => {
            const preview = previews[index]
            return (
              <Box
                key={`${file.name}-${file.size}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1,
                  pr: 0.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  maxWidth: 320,
                }}
              >
                {preview ? (
                  <Box
                    component="img"
                    src={preview}
                    alt={file.name}
                    sx={{
                      width: THUMB_SIZE,
                      height: THUMB_SIZE,
                      objectFit: 'cover',
                      borderRadius: 1,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: THUMB_SIZE,
                      height: THUMB_SIZE,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      color: 'text.secondary',
                      flexShrink: 0,
                    }}
                  >
                    {file.name.toLowerCase().endsWith('.pdf') ? (
                      <PictureAsPdfOutlinedIcon />
                    ) : (
                      <DescriptionOutlinedIcon />
                    )}
                  </Box>
                )}
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography variant="body2" noWrap title={file.name}>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {pdfPages[fileKey(file)] !== undefined
                      ? `PDF · ${pdfPages[fileKey(file)] === 1 ? '1 página' : `${pdfPages[fileKey(file)]} páginas`} · `
                      : ''}
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>
                <Tooltip title="Quitar">
                  <span>
                    <IconButton
                      size="small"
                      aria-label={`Quitar ${file.name}`}
                      onClick={() => removeAt(index)}
                      disabled={busy}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            )
          })}
        </Box>
      )}
      <Dialog
        open={mergeOpen}
        onClose={merging ? undefined : () => setMergeOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Unir {photos.length} fotos en un PDF</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Cada foto va en una página, en el orden de la lista. El PDF reemplaza a las fotos.
          </Typography>
          <TextField
            label="Nombre del PDF"
            size="small"
            fullWidth
            value={mergeName}
            onChange={(event) => setMergeName(event.target.value.slice(0, 120))}
            disabled={merging}
          />
          {mergeError && (
            <Typography variant="body2" sx={{ color: 'error.main', mt: 1 }}>
              {mergeError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setMergeOpen(false)} disabled={merging}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void confirmMerge()} disabled={merging}>
            {merging ? 'Uniendo…' : 'Unir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AttachmentPicker
