import { useEffect, useMemo, useRef, type ChangeEvent } from 'react'
import { Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import CloseIcon from '@mui/icons-material/Close'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'

import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_RULES_TEXT,
  formatFileSize,
  isImageFile,
} from '@/components/interventions/attachmentRules'

interface AttachmentPickerProps {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
  error?: string
}

const THUMB_SIZE = 72

// Selector de archivos de evidencia para el formulario de intervención (CRM-087, criterio 4).
// Muestra una miniatura de cada imagen y un ícono para los documentos. Los archivos todavía no
// se subieron: se suben recién cuando se guarda la intervención.
export const AttachmentPicker = ({ files, onChange, disabled, error }: AttachmentPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  // Link temporal para mostrar cada imagen antes de subirla. Se libera al cambiar la lista
  // o al salir de la pantalla, para no dejar memoria ocupada.
  const previews = useMemo(
    () => files.map((file) => (isImageFile(file.name) ? URL.createObjectURL(file) : null)),
    [files]
  )
  useEffect(() => () => previews.forEach((url) => url && URL.revokeObjectURL(url)), [previews])

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    // Se suman a los ya elegidos, sin repetir el mismo archivo
    const isNew = (file: File) => !files.some((f) => f.name === file.name && f.size === file.size)
    onChange([...files, ...selected.filter(isNew)])
    // Vaciar el input permite volver a elegir el mismo archivo si se lo quitó
    event.target.value = ''
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
          disabled={disabled}
          sx={{ textTransform: 'none' }}
        >
          Adjuntar archivos
        </Button>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {ATTACHMENT_RULES_TEXT}
        </Typography>
      </Stack>

      {error && (
        <Typography variant="body2" sx={{ color: 'error.main', mt: 1 }}>
          {error}
        </Typography>
      )}

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
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>
                <Tooltip title="Quitar">
                  <span>
                    <IconButton
                      size="small"
                      aria-label={`Quitar ${file.name}`}
                      onClick={() => removeAt(index)}
                      disabled={disabled}
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
    </Box>
  )
}

export default AttachmentPicker
