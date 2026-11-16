import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LockIcon from '@mui/icons-material/Lock'
import { useParams, useNavigate } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import {
  getPate,
  getPateFollowUps,
  createPateFollowUp,
  changePateStatus,
  type PateResponse,
  type PateFollowUp,
  type PateEvaluation,
} from '@/services/pate.service'
import { listEdteMeetings, type EdteMeetingSummary } from '@/services/edteMeeting.service'
import { formatMeetingDate, MEETING_PERIOD_LABELS } from '@/components/edte/edteLabels'
import { canManageTrajectories } from '@/services/session'
import { FollowUpHistoryTable } from '@/components/pate/FollowUpHistoryTable'
import { AddFollowUpDialog } from '@/components/pate/AddFollowUpDialog'
import { ClosePateDialog } from '@/components/pate/ClosePateDialog'
import { PateStatusChip } from '@/components/edteReferrals/PateStatusChip'
import { EVALUATION_LABELS } from '@/components/pate/pateLabels'

export const PateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionErrors, setActionErrors] = useState<string[]>([])
  const [followUpError, setFollowUpError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [pate, setPate] = useState<PateResponse | null>(null)
  const [followUps, setFollowUps] = useState<PateFollowUp[]>([])
  const [meetings, setMeetings] = useState<EdteMeetingSummary[]>([])

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [submittingAction, setSubmittingAction] = useState(false)

  const canManage = canManageTrajectories()

  useEffect(() => {
    let isMounted = true

    if (!id) return

    async function fetchData() {
      try {
        setLoading(true)
        setLoadError(null)
        setFollowUpError(null)
        const pateData = await getPate(id)
        if (!isMounted) return
        setPate(pateData)

        try {
          const followUpsData = await getPateFollowUps(id)
          if (!isMounted) return
          setFollowUps(followUpsData)
        } catch (err: unknown) {
          if (!isMounted) return
          setFollowUps([])
          const msg =
            err instanceof Error ? err.message : 'No se pudo cargar el historial de seguimientos.'
          setFollowUpError(msg)
        }

        // Cargar reuniones para el select de seguimientos
        if (canManage) {
          try {
            const meetingsData = await listEdteMeetings({ year: pateData.year })
            if (!isMounted) return
            setMeetings(meetingsData)
          } catch {
            // No bloqueante
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return
        const msg = err instanceof Error ? err.message : 'Error al cargar los datos del PATE.'
        setLoadError(msg)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void fetchData()

    return () => {
      isMounted = false
    }
  }, [id, canManage])

  const handleAddFollowUp = async (data: {
    edteMeetingId: string
    progress: string
    evaluation: PateEvaluation
    observations?: string
  }) => {
    if (!id) return
    try {
      setSubmittingAction(true)
      const created = await createPateFollowUp(id, data)
      setFollowUps((prev) => [created, ...prev])
      setSuccessMessage('Seguimiento registrado exitosamente.')
      setTimeout(() => setSuccessMessage(null), 4000)
    } finally {
      setSubmittingAction(false)
    }
  }

  const handleClosePate = async (data: {
    finalEvaluation: PateEvaluation
    finalObservations?: string
  }) => {
    if (!id) return
    try {
      setSubmittingAction(true)
      const updated = await changePateStatus(id, {
        status: 'CLOSED',
        finalEvaluation: data.finalEvaluation,
        finalObservations: data.finalObservations,
      })
      setPate(updated)
      setSuccessMessage('El PATE ha sido cerrado exitosamente.')
      setTimeout(() => setSuccessMessage(null), 4000)
    } finally {
      setSubmittingAction(false)
    }
  }

  const handleConfirmPate = async () => {
    if (!id) return
    try {
      setSubmittingAction(true)
      setActionErrors([])
      const updated = await changePateStatus(id, { status: 'IN_PROGRESS' })
      setPate(updated)
      setConfirmDialogOpen(false)
      setSuccessMessage('PATE confirmado y puesto en curso.')
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: unknown) {
      let messages: string[] = []
      if (err && typeof err === 'object' && 'details' in err) {
        const details = (err as { details?: { errors?: string[] } }).details
        if (Array.isArray(details?.errors)) {
          messages = details.errors
        }
      }
      if (messages.length === 0) {
        messages = [err instanceof Error ? err.message : 'Error al confirmar el PATE.']
      }
      setActionErrors(messages)
    } finally {
      setSubmittingAction(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <PageContainer>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        </PageContainer>
      </MainLayout>
    )
  }

  if (loadError || !pate) {
    return (
      <MainLayout>
        <PageContainer>
          <Alert severity="error" sx={{ mb: 3 }}>
            {loadError || 'No se encontró el PATE solicitado.'}
          </Alert>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Volver
          </Button>
        </PageContainer>
      </MainLayout>
    )
  }

  const isClosed = pate.status === 'CLOSED'
  const isDraft = pate.status === 'DRAFT'
  const isInProgress = pate.status === 'IN_PROGRESS'

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Plan de Acompañamiento a las Trayectorias (PATE)"
          subtitle={`${pate.student.lastName}, ${pate.student.firstName} · Ciclo Lectivo ${pate.year}`}
          breadcrumbs={[
            { label: 'Inicio', href: '/home' },
            { label: 'Derivados EDTE', href: '/edte-referrals' },
            { label: 'Detalle PATE' },
          ]}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
                Volver
              </Button>
              {canManage && isDraft && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CheckCircleIcon />}
                  disabled={submittingAction}
                  onClick={() => setConfirmDialogOpen(true)}
                >
                  Confirmar PATE
                </Button>
              )}
              {canManage && isInProgress && (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setAddDialogOpen(true)}
                  >
                    Agregar Seguimiento
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LockIcon />}
                    onClick={() => setCloseDialogOpen(true)}
                  >
                    Cerrar PATE
                  </Button>
                </>
              )}
            </Box>
          }
        />

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {actionErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setActionErrors([])}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              No se pudo confirmar el PATE:
            </Typography>
            <Box component="ul" sx={{ m: '4px 0 0 0', pl: 2.5 }}>
              {actionErrors.map((msg, idx) => (
                <li key={idx}>
                  <Typography variant="body2">{msg}</Typography>
                </li>
              ))}
            </Box>
          </Alert>
        )}

        {/* Resumen del estado y datos generales */}
        <ContentCard sx={{ mb: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6">Estado del Plan</Typography>
            <PateStatusChip state={pate.status} />
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Estudiante
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {pate.student.lastName}, {pate.student.firstName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                DNI: {pate.student.dni}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Reunión EDTE de Origen
              </Typography>
              <Typography variant="body1">
                {pate.edteMeeting
                  ? `${formatMeetingDate(pate.edteMeeting.date)} (${MEETING_PERIOD_LABELS[pate.edteMeeting.period as keyof typeof MEETING_PERIOD_LABELS] ?? pate.edteMeeting.period})`
                  : '—'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Creado por
              </Typography>
              <Typography variant="body1">{pate.createdBy?.name || '—'}</Typography>
            </Box>
          </Box>

          {isClosed && pate.finalEvaluation && (
            <Paper variant="outlined" sx={{ mt: 3, p: 2, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Cierre y Evaluación Final
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Typography variant="body2">Resultado:</Typography>
                <Chip
                  label={EVALUATION_LABELS[pate.finalEvaluation]}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    borderColor: 'divider',
                  }}
                />
                {pate.closedBy && (
                  <Typography variant="caption" color="text.secondary">
                    (Cerrado por {pate.closedBy.name})
                  </Typography>
                )}
              </Box>
              {pate.finalObservations && (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {pate.finalObservations}
                </Typography>
              )}
            </Paper>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Diagnóstico y Estrategias */}
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Diagnóstico de Situación
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {pate.diagnosis || '—'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Estrategias de Acompañamiento
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {pate.supportStrategies || '—'}
              </Typography>
            </Box>

            {pate.schedule && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Cronograma de Actividades
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                  {pate.schedule}
                </Typography>
              </Box>
            )}
          </Stack>
        </ContentCard>

        {/* Historial de Seguimientos (CRM-080) */}
        <ContentCard>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Box>
              <Typography variant="h6">Historial de Seguimientos y Avances</Typography>
              <Typography variant="caption" color="text.secondary">
                Registros periódicos acordados en las reuniones posteriores del EDTE (E4-RF-07)
              </Typography>
            </Box>
            {canManage && isInProgress && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
              >
                Agregar Seguimiento
              </Button>
            )}
          </Box>

          {followUpError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {followUpError}
            </Alert>
          )}

          <FollowUpHistoryTable followUps={followUps} />
        </ContentCard>

        {/* Diálogos */}
        <AddFollowUpDialog
          open={addDialogOpen}
          meetings={meetings}
          submitting={submittingAction}
          onClose={() => setAddDialogOpen(false)}
          onSubmit={handleAddFollowUp}
        />

        <ClosePateDialog
          open={closeDialogOpen}
          submitting={submittingAction}
          onClose={() => setCloseDialogOpen(false)}
          onSubmit={handleClosePate}
        />

        {/* Confirmación para confirmar PATE (irreversible) */}
        <Dialog
          open={confirmDialogOpen}
          onClose={submittingAction ? undefined : () => setConfirmDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirmar y poner en curso el PATE</DialogTitle>
          <DialogContent>
            <DialogContentText variant="body2">
              Al confirmar el PATE se crean automáticamente las inscripciones a las materias que el
              alumno debe recursar y el plan dejará de ser editable. ¿Deseas continuar?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={submittingAction}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmPate}
              disabled={submittingAction}
              startIcon={
                submittingAction ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <CheckCircleIcon />
                )
              }
            >
              Confirmar
            </Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    </MainLayout>
  )
}

export default PateDetailPage
