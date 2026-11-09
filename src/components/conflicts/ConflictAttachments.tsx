import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  createLegalConflictAttachment,
  getLegalConflictDetail,
  type LegalConflictDetail,
} from '@/services/conflicts.service'

function dateLabel(value: string | undefined) {
  if (!value) return 'Fecha no disponible'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : date.toLocaleString('es-AR')
}

export default function ConflictAttachments({
  conflictId,
}: {
  conflictId: string
}) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<LegalConflictDetail | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!open) return

    let active = true
    setLoading(true)
    setError('')
    setDetail(null)

    getLegalConflictDetail(conflictId)
      .then((result) => {
        if (active) setDetail(result)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudo consultar el conflicto.'
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, conflictId])

  const save = async () => {
    const text = content.trim()
    if (!text || saving) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await createLegalConflictAttachment(conflictId, text)

      const updated = await getLegalConflictDetail(conflictId)
      setDetail(updated)
      setContent('')
      setSuccess(
        'Anexo registrado correctamente. No podrá modificarse ni eliminarse.'
      )
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar el anexo.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button
        size="small"
        sx={{ mt: 1 }}
        onClick={() => {
          setOpen(true)
          setSuccess('')
        }}
      >
        Ver acta y anexos
      </Button>

      <Dialog
        open={open}
        onClose={() => {
          if (!saving) setOpen(false)
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Acta original y anexos</DialogTitle>

        <DialogContent dividers>
          {loading && <CircularProgress size={24} />}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {detail && !loading && (
            <Stack spacing={2}>
              <Alert severity="info">
                El acta original y sus anexos son permanentes y de solo lectura.
              </Alert>

              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Informe original
              </Typography>

              <Typography
                sx={{
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}
              >
                {detail.detailedReport}
              </Typography>

              <Divider />

              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Historial de anexos
              </Typography>

              {detail.attachments?.length ? (
                [...detail.attachments]
                  .sort(
                    (a, b) =>
                      (a.date ?? '').localeCompare(b.date ?? '') ||
                      a.id.localeCompare(b.id)
                  )
                  .map((attachment) => (
                    <Box
                      key={attachment.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {dateLabel(attachment.date)}
                        {' · Autor: '}
                        {attachment.authorId}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 1,
                          whiteSpace: 'pre-wrap',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {attachment.content}
                      </Typography>
                    </Box>
                  ))
              ) : (
                <Typography color="text.secondary">
                  Todavía no hay anexos registrados.
                </Typography>
              )}

              <Divider />

              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Agregar anexo
              </Typography>

              <TextField
                multiline
                minRows={4}
                fullWidth
                label="Nuevo seguimiento"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Describí el seguimiento o la nueva intervención..."
                disabled={saving}
              />

              <Alert severity="warning">
                Una vez guardado, este anexo no podrá editarse ni eliminarse.
              </Alert>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  disabled={!content.trim() || saving}
                  onClick={save}
                >
                  {saving ? 'Guardando...' : 'Guardar anexo'}
                </Button>
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
