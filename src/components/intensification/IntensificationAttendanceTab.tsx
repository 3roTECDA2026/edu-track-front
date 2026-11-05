import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import SaveIcon from '@mui/icons-material/Save'

import { ContentCard } from '@/components/common/ContentCard'
import { AddButton } from '@/components/common/AddButton'
import { StandardTablePagination } from '@/components/common/StandardTablePagination'
import {
  ATTENDANCE_LABELS,
  ATTENDANCE_SHORT_LABELS,
  MODEL_SHORT_LABELS,
  PERIOD_LABELS,
  sectionLabel,
} from '@/components/intensification/intensificationLabels'
import { useIntensificationAttendance } from '@/hooks/useIntensificationAttendance'
import {
  intensificationAttendanceService,
  type IntensificationAttendanceStudent,
  type IntensificationAttendanceValue,
} from '@/services/intensificationAttendance.service'
import type { IntensificationSchedule } from '@/services/intensificationSchedule.service'
import { currentUser } from '@/utils/currentUser'

const columns = ['Alumno', 'DNI', 'Intensifica en', 'Modelo']

// Los botones de cada fila, en el orden en que se muestran
const VALUES: IntensificationAttendanceValue[] = ['PRESENT', 'ABSENT', 'EXCUSED']

// Fecha de hoy (AAAA-MM-DD) con la hora local, como la carga diaria
const todayIso = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

const isWeekend = (date: string) => {
  const weekDay = new Date(`${date}T00:00:00`).getDay()
  return weekDay === 0 || weekDay === 6
}

const formatDate = (date: string) => date.split('-').reverse().join('/')

const studentName = (item: IntensificationAttendanceStudent) =>
  `${item.student.lastName}, ${item.student.firstName}`

// Fecha inicial: hoy, si está dentro del período; si no, el día del período más cercano
function defaultDate(schedule?: IntensificationSchedule) {
  const today = todayIso()
  if (!schedule) return today
  if (today < schedule.startDate) return schedule.startDate
  if (today > schedule.endDate) return schedule.endDate
  return today
}

// Estilo de cada botón: elegido, se pinta (negro, rojo o gris); si no, queda con borde gris
function buttonSx(value: IntensificationAttendanceValue, selected: boolean) {
  if (!selected) {
    return { borderColor: '#e5e7eb', color: 'text.secondary', backgroundColor: 'transparent' }
  }
  const backgroundColor =
    value === 'PRESENT' ? 'primary.main' : value === 'ABSENT' ? 'error.main' : 'text.secondary'
  return {
    borderColor: 'transparent',
    color: '#ffffff',
    backgroundColor,
    '&:hover': { backgroundColor, opacity: 0.9 },
  }
}

interface IntensificationAttendanceTabProps {
  // Períodos del ciclo elegido (los carga la pantalla de Intensificación)
  schedules: IntensificationSchedule[]
  // Dirección o administración: cargan la asistencia de todos los alumnos
  canEdit: boolean
  onMessage: (message: string, severity: 'success' | 'error') => void
}

// Asistencia de los alumnos que intensifican en otra sección (modelos 2 y 3), por período,
// materia y fecha (CRM-059). Es independiente de la asistencia diaria de su curso.
export const IntensificationAttendanceTab = ({
  schedules,
  canEdit,
  onMessage,
}: IntensificationAttendanceTabProps) => {
  const user = useMemo(currentUser, [])
  const isTeacher = user.role === 'TEACHER'

  const [scheduleId, setScheduleId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState('')
  const [marks, setMarks] = useState<Record<string, IntensificationAttendanceValue>>({})
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const schedule = schedules.find((item) => item.id === scheduleId)

  // Si el período elegido no está en el ciclo, se elige el primero con su primera materia
  useEffect(() => {
    if (!schedules.some((item) => item.id === scheduleId)) {
      const first = schedules[0]
      setScheduleId(first?.id ?? '')
      setSubjectId(first?.subjects[0]?.subjectId ?? '')
      setDate(defaultDate(first))
      setPage(0)
    }
  }, [schedules, scheduleId])

  // La fecha tiene que estar dentro del período; los fines de semana y los días futuros se
  // pueden consultar, pero no guardar (lo mismo controla el back)
  const outOfPeriod =
    !date || !schedule || date < schedule.startDate || date > schedule.endDate
  const dateError = !date
    ? 'Elegí una fecha'
    : schedule && outOfPeriod
      ? `Tiene que estar entre el ${formatDate(schedule.startDate)} y el ${formatDate(schedule.endDate)}`
      : isWeekend(date)
        ? 'No se toma asistencia los sábados ni los domingos'
        : date > todayIso()
          ? 'No se puede cargar asistencia de días futuros'
          : null

  const { data, loading, error, reload } = useIntensificationAttendance({
    scheduleId,
    subjectId,
    date,
    enabled: !outOfPeriod,
  })
  const students = useMemo(() => data?.students ?? [], [data])

  // Al llegar los datos, los botones muestran lo que ya estaba cargado
  useEffect(() => {
    const loaded: Record<string, IntensificationAttendanceValue> = {}
    for (const item of students) {
      if (item.value) loaded[item.intensificationId] = item.value
    }
    setMarks(loaded)
  }, [students])

  // La dirección y la administración cargan a todos; un docente, solo a sus alumnos
  const canMark = (item: IntensificationAttendanceStudent) =>
    canEdit || (isTeacher && item.responsibleTeacherId === user.userId)
  const editable = students.filter(canMark)

  // Hay algo para guardar si cambió alguna fila que el usuario puede cargar
  const changed = editable.filter(
    (item) => (marks[item.intensificationId] ?? null) !== item.value
  )
  const canSave = !dateError && !saving && changed.length > 0

  // Si cambió la lista y la página quedó vacía, se muestra la última que tiene datos
  const lastPage = Math.max(0, Math.ceil(students.length / rowsPerPage) - 1)
  const currentPage = Math.min(page, lastPage)
  const pageItems = students.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage)

  function markAllPresent() {
    setMarks((current) => {
      const next = { ...current }
      for (const item of editable) next[item.intensificationId] = 'PRESENT'
      return next
    })
  }

  async function handleSave() {
    if (!canSave) return
    // Se mandan solo las filas que el usuario puede cargar y que tienen un valor elegido
    const records = editable.flatMap((item) => {
      const value = marks[item.intensificationId]
      return value ? [{ intensificationId: item.intensificationId, value }] : []
    })
    setSaving(true)
    try {
      await intensificationAttendanceService.save({ scheduleId, subjectId, date, records })
      onMessage('Asistencia guardada.', 'success')
      reload()
    } catch (err: unknown) {
      onMessage(err instanceof Error ? err.message : 'No se pudo guardar la asistencia.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (schedules.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Todavía no hay períodos configurados en este ciclo. Configuralos en la pestaña Calendario.
        </Typography>
      </Box>
    )
  }

  return (
    <>
      {/* Una sola tarjeta: filtros arriba, tabla y paginado, como en la asignación */}
      <ContentCard>
        <Stack
          sx={{
            p: 2,
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', md: 'flex-start' },
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <FormControl size="small" sx={{ flex: 1, minWidth: 180 }}>
            <InputLabel id="lbl-attendance-period">Período</InputLabel>
            <Select
              labelId="lbl-attendance-period"
              label="Período"
              value={scheduleId}
              onChange={(event) => {
                const next = schedules.find((item) => item.id === event.target.value)
                setScheduleId(event.target.value)
                setSubjectId(next?.subjects[0]?.subjectId ?? '')
                setDate(defaultDate(next))
                setPage(0)
              }}
            >
              {schedules.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {PERIOD_LABELS[item.period]} · {formatDate(item.startDate)} al{' '}
                  {formatDate(item.endDate)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ flex: 1, minWidth: 200 }}>
            <InputLabel id="lbl-attendance-subject">Materia</InputLabel>
            <Select
              labelId="lbl-attendance-subject"
              label="Materia"
              value={subjectId}
              onChange={(event) => {
                setSubjectId(event.target.value)
                setPage(0)
              }}
            >
              {schedule?.subjects.map((entry) => (
                <MenuItem key={entry.subjectId} value={entry.subjectId}>
                  {entry.subjectName} · {entry.gradeLevel}° año
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="date"
            size="small"
            label="Fecha"
            value={date}
            onChange={(event) => {
              setDate(event.target.value)
              setPage(0)
            }}
            error={Boolean(dateError)}
            helperText={dateError ?? ' '}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { min: schedule?.startDate, max: schedule?.endDate },
            }}
            sx={{ minWidth: 180 }}
          />
        </Stack>

        {/* Aclaración y referencias de los botones */}
        <Stack
          sx={{
            px: 2,
            py: 1.5,
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Se muestran los alumnos que intensifican en otra sección (modelos 2 y 3). Esta
            asistencia es independiente de la de su curso.
          </Typography>
          <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap' }}>
            {VALUES.map((value) => (
              <Typography key={value} variant="caption" sx={{ color: 'text.secondary' }}>
                <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {ATTENDANCE_SHORT_LABELS[value]}
                </Box>{' '}
                {ATTENDANCE_LABELS[value]}
              </Typography>
            ))}
          </Stack>
        </Stack>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 760 }}>
            <TableHead sx={{ backgroundColor: '#fafafa' }}>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column}>{column}</TableCell>
                ))}
                <TableCell align="right">Asistencia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!subjectId ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    align="center"
                    sx={{ py: 4, color: 'text.secondary' }}
                  >
                    Este período todavía no tiene materias. Agregalas en la pestaña Calendario.
                  </TableCell>
                </TableRow>
              ) : outOfPeriod ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    align="center"
                    sx={{ py: 4, color: 'text.secondary' }}
                  >
                    Elegí una fecha dentro del período.
                  </TableCell>
                </TableRow>
              ) : loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} sx={{ py: 3 }}>
                    <Alert severity="error">{error}</Alert>
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    align="center"
                    sx={{ py: 4, color: 'text.secondary' }}
                  >
                    No hay alumnos que intensifiquen esta materia en otra sección en este período.
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((item) => {
                  const mark = marks[item.intensificationId]
                  const allowed = canMark(item)
                  return (
                    <TableRow key={item.intensificationId} hover>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {studentName(item)}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{item.student.dni}</TableCell>
                      <TableCell>
                        {item.targetClassSection ? sectionLabel(item.targetClassSection) : '—'}
                      </TableCell>
                      <TableCell>{MODEL_SHORT_LABELS[item.model]}</TableCell>
                      <TableCell align="right">
                        {allowed ? (
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                            {VALUES.map((value) => (
                              <Tooltip key={value} title={ATTENDANCE_LABELS[value]} arrow>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  aria-pressed={mark === value}
                                  onClick={() =>
                                    setMarks((current) => ({
                                      ...current,
                                      [item.intensificationId]: value,
                                    }))
                                  }
                                  sx={{
                                    minWidth: 40,
                                    height: 30,
                                    p: 0,
                                    fontWeight: 700,
                                    borderRadius: 1,
                                    boxShadow: 'none',
                                    ...buttonSx(value, mark === value),
                                  }}
                                >
                                  {ATTENDANCE_SHORT_LABELS[value]}
                                </Button>
                              </Tooltip>
                            ))}
                          </Stack>
                        ) : item.value ? (
                          // Lo cargado por el docente responsable: se ve, pero no se cambia
                          <Chip size="small" label={ATTENDANCE_LABELS[item.value]} />
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Sin cargar
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <StandardTablePagination
          count={students.length}
          page={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows)
            setPage(0)
          }}
          itemLabel="alumnos"
        />
      </ContentCard>

      {/* Acciones: solo si hay alumnos que el usuario puede cargar */}
      {editable.length > 0 && !loading && !error && (
        <Stack
          direction="row"
          sx={{ mt: 2, gap: 1.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}
        >
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<DoneAllIcon />}
            onClick={markAllPresent}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#e5e7eb' }}
          >
            Todos presentes
          </Button>
          <AddButton
            label={saving ? 'Guardando...' : 'Guardar asistencia'}
            icon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={() => void handleSave()}
            disabled={!canSave}
          />
        </Stack>
      )}
    </>
  )
}

export default IntensificationAttendanceTab
