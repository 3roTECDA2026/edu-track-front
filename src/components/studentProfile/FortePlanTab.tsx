import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import TimelineIcon from '@mui/icons-material/Timeline'

import { FORTE_STATUS_CONFIG } from '@/components/studentProfile/fortePlanLabels'
import { EMPTY, formatDate } from '@/components/studentProfile/profileLabels'
import { COLORS, cardSx, labelSx } from '@/components/studentProfile/profileStyles'
import { SoftBadge } from '@/components/studentProfile/SoftBadge'
import { TabEmpty, TabError, TabLoading } from '@/components/studentProfile/TabStates'
import { useLazyResource } from '@/hooks/useLazyResource'
import {
  createFortePlanReport,
  getFortePlanReports,
  type FortePlan,
} from '@/services/fortePlan.service'

// Fecha de hoy en formato AAAA-MM-DD, con la hora local
const todayIso = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

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
  onSaved: (message: string, severity: 'success' | 'error') => void
}

// Plan Forte del alumno (E4-RF-14, CRM-089): datos del plan, reporte de evolución e historial.
// Estos reportes van separados del boletín: no aparecen en el RITE ni en la grilla.
export const FortePlanTab = ({ plan, onSaved }: FortePlanTabProps) => {
  const today = todayIso()
  const [progress, setProgress] = useState('')
  const [observations, setObservations] = useState('')
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reports = useLazyResource(`forte-reports:${plan.id}`, (signal) =>
    getFortePlanReports(plan.id, signal)
  )

  const active = plan.status === 'ACTIVE'
  const status = FORTE_STATUS_CONFIG[plan.status]
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

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {/* Datos del plan */}
      <Paper variant="outlined" sx={{ ...cardSx, p: 2.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Plan Forte</Typography>
          <SoftBadge label={status.label} color={status.color} background={status.background} />
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
    </Box>
  )
}

export default FortePlanTab
