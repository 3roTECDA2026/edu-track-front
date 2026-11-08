import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import TimelineIcon from '@mui/icons-material/Timeline'

import { EditButton } from '@/components/common/EditButton'
import { FORTE_STATUS_CONFIG } from '@/components/studentProfile/fortePlanLabels'
import { EMPTY, formatDate } from '@/components/studentProfile/profileLabels'
import { COLORS, cardSx, labelSx } from '@/components/studentProfile/profileStyles'
import { SoftBadge } from '@/components/studentProfile/SoftBadge'
import { TabEmpty, TabError, TabLoading } from '@/components/studentProfile/TabStates'
import { useLazyResource } from '@/hooks/useLazyResource'
import {
  createFortePlanReport,
  getFortePlanReports,
  updateFortePlan,
  type FortePlan,
} from '@/services/fortePlan.service'

// Fecha de hoy en formato AAAA-MM-DD, con la hora local
const todayIso = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

// Cómo termina el plan: finalizar (completó el programa) o dar de baja
const CLOSE_ACTIONS = {
  COMPLETED: { button: 'Finalizar', title: 'Finalizar el Plan Forte', done: 'finalizado' },
  WITHDRAWN: { button: 'Dar de baja', title: 'Dar de baja del Plan Forte', done: 'dado de baja' },
} as const
type CloseStatus = keyof typeof CLOSE_ACTIONS

const Field = ({ label, value }: { label: string; value: string }) => (
  <Box>
    <Typography sx={{ ...labelSx, mb: 0.25 }}>{label}</Typography>
    <Typography variant="body2" sx={{ color: COLORS.ink, fontWeight: 500 }}>
      {value}
    </Typography>
  </Box>
)

interface FortePlanTabProps {
  plan: FortePlan
  // Dirección, EOE/directivos y administración: editan, finalizan, dan de baja y reasignan
  canManage: boolean
  onEdit: () => void
  onReassign: () => void
  onSaved: (message: string, severity: 'success' | 'error') => void
}

// Plan Forte del alumno (E4-RF-14, CRM-089): datos del plan, reporte de evolución e historial.
// Estos reportes van separados del boletín: no aparecen en el RITE ni en la grilla.
export const FortePlanTab = ({
  plan,
  canManage,
  onEdit,
  onReassign,
  onSaved,
}: FortePlanTabProps) => {
  const today = todayIso()
  const [progress, setProgress] = useState('')
  const [observations, setObservations] = useState('')
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [closing, setClosing] = useState<CloseStatus | null>(null)
  const [closingWorking, setClosingWorking] = useState(false)

  const reports = useLazyResource(`forte-reports:${plan.id}`, (signal) =>
    getFortePlanReports(plan.id, signal)
  )

  const active = plan.status === 'ACTIVE'
  const status = FORTE_STATUS_CONFIG[plan.status]
  const studentName = `${plan.student.lastName}, ${plan.student.firstName}`
  const dateError = !date
    ? 'Elegí la fecha.'
    : date > today
      ? 'La fecha no puede ser futura.'
      : null
  const canSave = progress.trim() !== '' && !dateError && !saving

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await createFortePlanReport(plan.id, {
        progress: progress.trim(),
        observations: observations.trim() || null,
        date,
      })
      setProgress('')
      setObservations('')
      setDate(todayIso())
      reports.reload()
      onSaved('Reporte de evolución guardado.', 'success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el reporte.')
    } finally {
      setSaving(false)
    }
  }

  async function handleClose() {
    if (!closing) return
    setClosingWorking(true)
    try {
      await updateFortePlan(plan.id, { status: closing })
      onSaved(`${studentName}: Plan Forte ${CLOSE_ACTIONS[closing].done}.`, 'success')
      setClosing(null)
    } catch (err: unknown) {
      onSaved(
        err instanceof Error ? err.message : 'No se pudo cambiar el estado del plan.',
        'error'
      )
    } finally {
      setClosingWorking(false)
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {/* Datos del plan */}
      <Paper variant="outlined" sx={{ ...cardSx, p: 2.5 }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center', mb: 2, flexWrap: 'wrap', rowGap: 1 }}
        >
          <Typography variant="h6">Plan Forte</Typography>
          <SoftBadge label={status.label} color={status.color} background={status.background} />
          <Box sx={{ flexGrow: 1 }} />
          {canManage && active && (
            <>
              <EditButton label="Editar objetivos y responsable" onClick={onEdit} />
              {(Object.keys(CLOSE_ACTIONS) as CloseStatus[]).map((key) => (
                <Button key={key} size="small" color="inherit" onClick={() => setClosing(key)}>
                  {CLOSE_ACTIONS[key].button}
                </Button>
              ))}
            </>
          )}
          {canManage && !active && (
            <Button size="small" variant="outlined" color="inherit" onClick={onReassign}>
              Volver a asignar
            </Button>
          )}
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            mb: 2,
          }}
        >
          <Field label="Fecha de alta" value={formatDate(plan.assignedAt)} />
          <Field label="Responsable" value={plan.responsible?.name ?? EMPTY} />
          <Field
            label="Último reporte"
            value={plan.lastReportAt ? formatDate(plan.lastReportAt) : EMPTY}
          />
        </Box>
        <Field label="Objetivos pedagógicos" value={plan.pedagogicalGoals} />
      </Paper>

      {/* Formulario de reporte: solo mientras el alumno está activo en el programa */}
      {active ? (
        <Paper variant="outlined" sx={{ ...cardSx, p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Nuevo reporte de evolución
          </Typography>
          <Stack spacing={2}>
            <TextField
              type="date"
              label="Fecha"
              size="small"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              error={Boolean(dateError)}
              helperText={dateError ?? ' '}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }}
              sx={{ maxWidth: 220 }}
            />
            <TextField
              label="Evolución"
              multiline
              minRows={3}
              value={progress}
              onChange={(event) => setProgress(event.target.value.slice(0, 2000))}
              helperText="Saberes alcanzados y nivel de avance."
            />
            <TextField
              label="Observaciones (opcional)"
              multiline
              minRows={2}
              value={observations}
              onChange={(event) => setObservations(event.target.value.slice(0, 2000))}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                disableElevation
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={!canSave}
                onClick={() => void handleSave()}
              >
                {saving ? 'Guardando...' : 'Guardar reporte'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      ) : (
        <Alert severity="info">
          El alumno no está activo en el Plan Forte: no se pueden cargar reportes nuevos.
        </Alert>
      )}

      {/* Historial de reportes, del más reciente al más viejo */}
      <Paper variant="outlined" sx={{ ...cardSx, p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Historial de reportes
        </Typography>
        {reports.loading && !reports.data ? (
          <TabLoading />
        ) : reports.error ? (
          <TabError message={reports.error} onRetry={reports.reload} />
        ) : !reports.data || reports.data.length === 0 ? (
          <TabEmpty
            icon={<TimelineIcon />}
            title="Sin reportes"
            text="Todavía no se cargaron reportes de evolución."
          />
        ) : (
          <Stack spacing={1.5}>
            {reports.data.map((report) => (
              <Box
                key={report.id}
                sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 1.5, p: 2 }}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.75 }}>
                  {formatDate(report.date)} · {report.author?.name ?? EMPTY}
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.ink, whiteSpace: 'pre-line' }}>
                  {report.progress}
                </Typography>
                {report.observations && (
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', mt: 1, whiteSpace: 'pre-line' }}
                  >
                    Observaciones: {report.observations}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Confirmación para finalizar o dar de baja: mientras se procesa, no se cierra */}
      <Dialog
        open={closing !== null}
        onClose={() => !closingWorking && setClosing(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {closing ? `${CLOSE_ACTIONS[closing].title} · ${studentName}` : ''}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Ya no se van a poder cargar reportes. El historial se conserva, y el alumno se puede
            volver a asignar más adelante.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setClosing(null)} color="inherit" disabled={closingWorking}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={closing === 'WITHDRAWN' ? 'error' : 'primary'}
            disableElevation
            disabled={closingWorking}
            onClick={() => void handleClose()}
          >
            {closingWorking ? 'Guardando...' : closing ? CLOSE_ACTIONS[closing].button : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default FortePlanTab
