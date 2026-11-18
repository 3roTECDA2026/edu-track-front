import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined'
import { useParams } from 'react-router-dom'
import { attendanceService, type AttendanceQrCheckIn } from '@/services/attendance.service'

// Destino del QR: se abre en el celular, sin sesión, y marca la asistencia de hoy.
export const AttendanceQrCheckInPage = () => {
  const { studentId = '' } = useParams<{ studentId: string }>()
  const [result, setResult] = useState<AttendanceQrCheckIn | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!studentId) {
      setError('El QR no es válido.')
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    attendanceService
      .checkInByQr(studentId, controller.signal)
      .then(setResult)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'No se pudo registrar la asistencia')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [studentId, attempt])

  return (
    <Box
      sx={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center' }}
    >
      <Container maxWidth="xs" sx={{ py: 4 }}>
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            {loading && (
              <>
                <CircularProgress size={44} />
                <Typography variant="h6">Registrando asistencia...</Typography>
              </>
            )}

            {!loading && result && (
              <>
                <CheckCircleOutlinedIcon color="success" sx={{ fontSize: 56 }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Asistencia cargada
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Se registró la asistencia del {result.date.split('-').reverse().join('/')}.
                </Typography>
                {result.alreadyRegistered && (
                  <Alert severity="info" sx={{ width: '100%' }}>
                    La asistencia de hoy ya estaba registrada.
                  </Alert>
                )}
              </>
            )}

            {!loading && error && (
              <>
                <ErrorOutlinedIcon color="error" sx={{ fontSize: 56 }} />
                <Typography variant="h6">No se pudo cargar la asistencia</Typography>
                <Alert severity="error" sx={{ width: '100%' }}>
                  {error}
                </Alert>
                <Button variant="contained" onClick={() => setAttempt((value) => value + 1)}>
                  Reintentar
                </Button>
              </>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
