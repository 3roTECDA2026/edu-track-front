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
  Typography,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import { attendanceService } from '@/services/attendance.service'
import { saveBlob } from '@/utils/saveBlob'

interface AttendanceQrDialogProps {
  open: boolean
  studentId: string
  studentName: string
  onClose: () => void
}

export const AttendanceQrDialog = ({
  open,
  studentId,
  studentName,
  onClose,
}: AttendanceQrDialogProps) => {
  const [qrBlob, setQrBlob] = useState<Blob | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !studentId) return
    const controller = new AbortController()
    setQrBlob(null)
    setError(null)
    setLoading(true)
    attendanceService
      .getQrImage(studentId, controller.signal)
      .then(setQrBlob)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'No se pudo generar el QR')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [open, studentId])

  useEffect(() => {
    if (!qrBlob) {
      setImageUrl(null)
      return
    }
    const url = URL.createObjectURL(qrBlob)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [qrBlob])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>QR de asistencia</DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          pt: '12px !important',
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Mostrá este código para registrar la asistencia de {studentName}.
        </Typography>
        {loading && <CircularProgress size={36} />}
        {error && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        )}
        {imageUrl && (
          <Box
            component="img"
            src={imageUrl}
            alt={`QR de asistencia de ${studentName}`}
            sx={{ width: 260, height: 260, objectFit: 'contain' }}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cerrar
        </Button>
        <Button
          variant="contained"
          disableElevation
          startIcon={<DownloadIcon />}
          disabled={!qrBlob}
          onClick={() => qrBlob && saveBlob(qrBlob, `qr-asistencia-${studentId}.png`)}
        >
          Descargar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
