import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SyntheticEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { Trash2, UserRound } from 'lucide-react'

import MainLayout from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import PageHeader from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { AddButton } from '@/components/common/AddButton'
import { EditButton } from '@/components/common/EditButton'
import { CustomTabs } from '@/components/common/CustomTabs'
import PeriodDialog from '@/components/intensification/PeriodDialog'
import ScheduleSubjectDialog from '@/components/intensification/ScheduleSubjectDialog'
import AssignmentsTab from '@/components/intensification/AssignmentsTab'
import { getSubjects, type SubjectOption } from '@/services/subjects.service'
import {
  intensificationScheduleService,
  type IntensificationPeriod,
  type IntensificationSchedule,
  type ScheduleSubject,
  type ScheduleTeacher,
} from '@/services/intensificationSchedule.service'

// Los tres períodos del requerimiento (E3-RF-04), en el orden en que ocurren.
// Agosto pertenece al ciclo en curso; diciembre y febrero/marzo, al ciclo que cierran.
const PERIODS: {
  value: IntensificationPeriod
  label: string
  hint: (year: number) => string
  defaults: (year: number) => [string, string]
}[] = [
  {
    value: 'AUGUST',
    label: 'Agosto',
    hint: (year) => `Durante el ciclo ${year}`,
    defaults: (year) => [`${year}-08-03`, `${year}-08-14`],
  },
  {
    value: 'DECEMBER',
    label: 'Diciembre',
    hint: (year) => `Cierre del ciclo ${year}`,
    defaults: (year) => [`${year}-12-07`, `${year}-12-18`],
  },
  {
    value: 'FEBRUARY_MARCH',
    label: 'Febrero / Marzo',
    hint: (year) => `Cierre del ciclo ${year}, en ${year + 1}`,
    defaults: (year) => [`${year + 1}-02-16`, `${year + 1}-03-06`],
  },
]

// Pestañas de la pantalla: el calendario (CRM-055) y la asignación de alumnos (CRM-056 y 057)
const TABS = ['Calendario', 'Asignación de alumnos']

const EDIT_ROLES = ['SCHOOL_MANAGEMENT', 'ADMINISTRATOR']

// Rol del usuario logueado, leído del token. Solo sirve para mostrar u ocultar botones:
// el back valida igual los permisos en cada pedido.
function currentRole(): string | null {
  // Mismo orden que fetchApi: primero la sesión actual, después la recordada
  const token = sessionStorage.getItem('token') || localStorage.getItem('token')
  if (!token) return null
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return (JSON.parse(atob(payload)) as { role?: string }).role ?? null
  } catch {
    return null
  }
}

const formatDate = (date: string) => date.split('-').reverse().join('/')

interface SnackbarState {
  message: string
  severity: 'success' | 'error'
}

type PeriodDialogState =
  | { mode: 'create'; period: (typeof PERIODS)[number] }
  | { mode: 'edit'; period: (typeof PERIODS)[number]; schedule: IntensificationSchedule }

type SubjectDialogState =
  | { mode: 'add'; schedule: IntensificationSchedule }
  | { mode: 'teacher'; schedule: IntensificationSchedule; entry: ScheduleSubject }

type ConfirmState =
  | { kind: 'schedule'; schedule: IntensificationSchedule; label: string }
  | { kind: 'subject'; schedule: IntensificationSchedule; entry: ScheduleSubject }

const headCellSx = {
  fontWeight: 700,
  color: '#4b5563',
  fontSize: '0.75rem',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
} as const

export const IntensificationCalendarPage = () => {
  const thisYear = new Date().getFullYear()
  const yearOptions = [thisYear - 1, thisYear, thisYear + 1]
  const canEdit = EDIT_ROLES.includes(currentRole() ?? '')

  const [tab, setTab] = useState(0)
  const [year, setYear] = useState(thisYear)
  const [schedules, setSchedules] = useState<IntensificationSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [teachers, setTeachers] = useState<ScheduleTeacher[]>([])

  const [periodDialog, setPeriodDialog] = useState<PeriodDialogState | null>(null)
  const [subjectDialog, setSubjectDialog] = useState<SubjectDialogState | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null)

  // Mensajes de la pestaña de asignación, con el mismo Snackbar de la pantalla
  const showMessage = useCallback(
    (message: string, severity: 'success' | 'error') => setSnackbar({ message, severity }),
    []
  )

  const loadSchedules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSchedules(await intensificationScheduleService.list(year))
    } catch (err: unknown) {
      setSchedules([])
      setError(err instanceof Error ? err.message : 'No se pudo cargar el calendario')
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    void loadSchedules()
  }, [loadSchedules])

  // Materias y docentes para los modales (los docentes solo los puede pedir quien edita)
  useEffect(() => {
    const controller = new AbortController()
    getSubjects(controller.signal)
      .then(setSubjects)
      .catch(() => undefined)
    if (canEdit) {
      intensificationScheduleService
        .listTeachers(controller.signal)
        .then(setTeachers)
        .catch(() => undefined)
    }
    return () => controller.abort()
  }, [canEdit])

  const scheduleByPeriod = useMemo(
    () => new Map(schedules.map((schedule) => [schedule.period, schedule])),
    [schedules]
  )

  // Ejecuta una acción, muestra el resultado y recarga el calendario
  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setSaving(true)
    try {
      await action()
      setSnackbar({ message: successMessage, severity: 'success' })
      setPeriodDialog(null)
      setSubjectDialog(null)
      setConfirm(null)
      await loadSchedules()
    } catch (err: unknown) {
      setSnackbar({
        message: err instanceof Error ? err.message : 'No se pudo completar la acción',
        severity: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  function handlePeriodSubmit(startDate: string, endDate: string) {
    if (!periodDialog) return
    if (periodDialog.mode === 'create') {
      void runAction(
        () =>
          intensificationScheduleService.create({
            year,
            period: periodDialog.period.value,
            startDate,
            endDate,
          }),
        `Período de ${periodDialog.period.label.toLowerCase()} configurado.`
      )
    } else {
      void runAction(
        () =>
          intensificationScheduleService.updateDates(periodDialog.schedule.id, {
            startDate,
            endDate,
          }),
        'Fechas actualizadas.'
      )
    }
  }

  function handleSubjectSubmit(data: { subjectId: string; teacherId: string | null }) {
    if (!subjectDialog) return
    if (subjectDialog.mode === 'add') {
      void runAction(
        () => intensificationScheduleService.addSubject(subjectDialog.schedule.id, data),
        'Materia agregada al período.'
      )
    } else {
      void runAction(
        () =>
          intensificationScheduleService.updateSubjectTeacher(
            subjectDialog.schedule.id,
            subjectDialog.entry.id,
            data.teacherId
          ),
        'Docente actualizado.'
      )
    }
  }

  function handleConfirm() {
    if (!confirm) return
    if (confirm.kind === 'schedule') {
      void runAction(
        () => intensificationScheduleService.remove(confirm.schedule.id),
        'Período eliminado.'
      )
    } else {
      void runAction(
        () => intensificationScheduleService.removeSubject(confirm.schedule.id, confirm.entry.id),
        'Materia quitada del período.'
      )
    }
  }

  // Materias que todavía no están en el período elegido
  const availableSubjects =
    subjectDialog?.mode === 'add'
      ? subjects
          .filter(
            (subject) =>
              !subjectDialog.schedule.subjects.some((entry) => entry.subjectId === subject.id)
          )
          .sort((a, b) => a.gradeLevel - b.gradeLevel || a.name.localeCompare(b.name, 'es'))
      : []

  // Calendario: un cuadro por período, con sus fechas, materias y docentes (CRM-055)
  const calendar = (
    <Stack spacing={3}>
      {PERIODS.map((period) => {
        const schedule = scheduleByPeriod.get(period.value)
        return (
          <ContentCard key={period.value}>
            {/* Encabezado del período */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                px: 3,
                py: 2.5,
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <Box>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
                    {period.label}
                  </Typography>
                  {schedule ? (
                    <Chip
                      label={`${formatDate(schedule.startDate)} al ${formatDate(schedule.endDate)}`}
                      sx={{ fontWeight: 600 }}
                    />
                  ) : (
                    <Chip variant="outlined" label="Sin configurar" />
                  )}
                </Stack>
                <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                  {period.hint(year)}
                  {schedule ? ` · ${schedule.assignedStudents} alumnos asignados` : ''}
                </Typography>
              </Box>

              {canEdit &&
                (schedule ? (
                  <Stack direction="row" spacing={0.5}>
                    <EditButton
                      label="Editar fechas"
                      onClick={() => setPeriodDialog({ mode: 'edit', period, schedule })}
                    />
                    <Tooltip
                      title={
                        schedule.assignedStudents > 0
                          ? 'Tiene alumnos asignados: no se puede eliminar'
                          : 'Eliminar período'
                      }
                      arrow
                    >
                      <span>
                        <IconButton
                          size="small"
                          disabled={schedule.assignedStudents > 0}
                          onClick={() =>
                            setConfirm({ kind: 'schedule', schedule, label: period.label })
                          }
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                ) : (
                  <AddButton
                    label="Configurar período"
                    icon={<AddIcon />}
                    onClick={() => setPeriodDialog({ mode: 'create', period })}
                  />
                ))}
            </Box>

            {/* Período todavía sin fechas */}
            {!schedule && (
              <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Todavía no se definieron las fechas de este período.
                </Typography>
                {canEdit && (
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                    Usá “Configurar período” para cargarlas.
                  </Typography>
                )}
              </Box>
            )}

            {/* Materias del período */}
            {schedule && (
              <>
                <Table sx={{ '& .MuiTableCell-root': { px: 3 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headCellSx}>Materia</TableCell>
                      <TableCell sx={headCellSx} width={110}>
                        Año
                      </TableCell>
                      <TableCell sx={headCellSx}>Docente responsable</TableCell>
                      {canEdit && (
                        <TableCell sx={headCellSx} align="right" width={130}>
                          Acciones
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {schedule.subjects.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={canEdit ? 4 : 3}
                          sx={{ color: '#6b7280', py: 4 }}
                          align="center"
                        >
                          Todavía no hay materias en este período.
                        </TableCell>
                      </TableRow>
                    ) : (
                      schedule.subjects.map((entry) => (
                        <TableRow key={entry.id} hover>
                          <TableCell sx={{ fontWeight: 600, color: '#111827' }}>
                            {entry.subjectName}
                          </TableCell>
                          <TableCell>{entry.gradeLevel}° año</TableCell>
                          <TableCell sx={{ color: entry.teacher ? '#111827' : '#9ca3af' }}>
                            {entry.teacher?.name ?? 'Sin asignar'}
                          </TableCell>
                          {canEdit && (
                            <TableCell align="right">
                              <Tooltip title="Cambiar docente" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setSubjectDialog({ mode: 'teacher', schedule, entry })
                                  }
                                >
                                  <UserRound size={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Quitar del período" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => setConfirm({ kind: 'subject', schedule, entry })}
                                >
                                  <Trash2 size={18} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {canEdit && (
                  <Box sx={{ px: 3, py: 2, borderTop: '1px solid #e5e7eb' }}>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => setSubjectDialog({ mode: 'add', schedule })}
                      sx={{ color: '#111827', fontWeight: 600 }}
                    >
                      Agregar materia
                    </Button>
                  </Box>
                )}
              </>
            )}
          </ContentCard>
        )
      })}
    </Stack>
  )

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Intensificación"
          subtitle="Calendario de los períodos y asignación de los alumnos con materias pendientes."
          breadcrumbs={[
            { label: 'Inicio', href: '/home' },
            { label: 'Intensificación' },
            { label: TABS[tab] },
          ]}
        />

        {/* Pestañas dentro de la tarjeta estándar, como en la ficha del alumno */}
        <ContentCard>
          <CustomTabs
            tabs={TABS}
            value={tab}
            onChange={(_: SyntheticEvent, index: number) => setTab(index)}
          />

          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            {/* Ciclo lectivo: se aplica a las dos pestañas */}
            <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mb: 3 }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="lbl-year">Ciclo lectivo</InputLabel>
                <Select
                  labelId="lbl-year"
                  label="Ciclo lectivo"
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                >
                  {yearOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!canEdit && (
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Solo la dirección y la administración pueden hacer cambios.
                </Typography>
              )}
            </Stack>

            {error ? (
              <Alert severity="info">{error}</Alert>
            ) : loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : tab === 0 ? (
              calendar
            ) : (
              <AssignmentsTab
                schedules={schedules}
                canEdit={canEdit}
                onMessage={showMessage}
                onChanged={() => void loadSchedules()}
              />
            )}
          </Box>
        </ContentCard>
      </PageContainer>

      <PeriodDialog
        open={periodDialog !== null}
        mode={periodDialog?.mode ?? 'create'}
        periodLabel={periodDialog?.period.label ?? ''}
        initialStart={
          periodDialog?.mode === 'edit'
            ? periodDialog.schedule.startDate
            : (periodDialog?.period.defaults(year)[0] ?? '')
        }
        initialEnd={
          periodDialog?.mode === 'edit'
            ? periodDialog.schedule.endDate
            : (periodDialog?.period.defaults(year)[1] ?? '')
        }
        saving={saving}
        onClose={() => setPeriodDialog(null)}
        onSubmit={handlePeriodSubmit}
      />

      <ScheduleSubjectDialog
        open={subjectDialog !== null}
        mode={subjectDialog?.mode ?? 'add'}
        subjectLabel={
          subjectDialog?.mode === 'teacher'
            ? `${subjectDialog.entry.subjectName} ${subjectDialog.entry.gradeLevel}°`
            : undefined
        }
        subjects={availableSubjects}
        teachers={teachers}
        initialTeacherId={
          subjectDialog?.mode === 'teacher' ? (subjectDialog.entry.teacher?.id ?? null) : null
        }
        saving={saving}
        onClose={() => setSubjectDialog(null)}
        onSubmit={handleSubjectSubmit}
      />

      {/* Confirmación para eliminar */}
      <Dialog open={confirm !== null} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {confirm?.kind === 'schedule' ? 'Eliminar período' : 'Quitar materia'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {confirm?.kind === 'schedule'
              ? `¿Eliminar el período de ${confirm.label.toLowerCase()} del ciclo ${year}? Se quitan también sus materias.`
              : `¿Quitar ${confirm?.kind === 'subject' ? confirm.entry.subjectName : ''} de este período?`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm(null)} color="inherit" disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            disableElevation
            disabled={saving}
            onClick={handleConfirm}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mensajes de las acciones, con el Snackbar acordado en el proyecto */}
      <Snackbar
        open={snackbar !== null}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {snackbar ? (
          <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(null)}>
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </MainLayout>
  )
}

export default IntensificationCalendarPage
