import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Snackbar,
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
import SaveIcon from '@mui/icons-material/Save'
import CheckIcon from '@mui/icons-material/Check'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'

import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { StandardTablePagination } from '@/components/common/StandardTablePagination'
import { SHIFT_LABELS } from '@/components/students/studentLabels'
import { useAttendance } from '@/hooks/useAttendance'
import {
  attendanceService,
  type AttendanceEntry,
  type AttendanceSection,
  type DailyAttendanceRecord,
} from '@/services/attendance.service'

// Lo que se marca por alumno y cómo se guarda en el back:
// P = presente · A = ausente (1 falta) · R = retardo de ¼ · RH = retardo de ½ · J = ausente justificado
type DailyMark = 'P' | 'A' | 'R' | 'RH' | 'J'

// Los botones del wireframe: P · A · R · J. La R abre un menú para elegir ¼ o ½.
type ButtonKey = 'P' | 'A' | 'R' | 'J'

const BUTTONS: { value: ButtonKey; label: string; color: string }[] = [
  { value: 'P', label: 'Presente', color: '#111827' },
  { value: 'A', label: 'Ausente', color: '#dc2626' },
  { value: 'R', label: 'Retardo (¼ o ½ falta)', color: '#b45309' },
  { value: 'J', label: 'Justificado', color: '#2563eb' },
]

const isLate = (mark?: DailyMark) => mark === 'R' || mark === 'RH'

// Quiénes pueden corregir la asistencia de un día anterior (también lo controla el back)
const EDIT_PAST_ROLES = ['SCHOOL_MANAGEMENT', 'ADMINISTRATOR']

// Rol del usuario logueado, leído del token. Solo sirve para mostrar u ocultar opciones:
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

// Mensajes de las acciones, con el Snackbar acordado en el proyecto
interface SnackbarState {
  message: string
  severity: 'success' | 'error' | 'info'
}

const toEntry = (studentId: string, mark: DailyMark): AttendanceEntry => {
  switch (mark) {
    case 'P':
      return { studentId, value: 'PRESENT' }
    case 'A':
      return { studentId, value: 'ABSENT' }
    case 'R':
      return { studentId, value: 'QUARTER' }
    case 'RH':
      return { studentId, value: 'HALF' }
    case 'J':
      return { studentId, value: 'ABSENT', justified: true }
  }
}

const fromRecord = (record: DailyAttendanceRecord): DailyMark => {
  if (record.value === 'PRESENT') return 'P'
  if (record.value === 'ABSENT') return record.justified ? 'J' : 'A'
  if (record.value === 'QUARTER') return 'R'
  return 'RH'
}

// Texto del botón: la R muestra si el retardo es de ¼ o de ½
const buttonText = (button: ButtonKey, mark?: DailyMark) => {
  if (button !== 'R') return button
  if (mark === 'R') return 'R¼'
  if (mark === 'RH') return 'R½'
  return 'R'
}

const isSelected = (button: ButtonKey, mark?: DailyMark) =>
  button === 'R' ? isLate(mark) : mark === button

const getButtonStyle = (selected: boolean, option: (typeof BUTTONS)[number]) => {
  // La J sin elegir va con borde punteado, como en el wireframe
  const borderStyle = option.value === 'J' && !selected ? 'dashed' : 'solid'
  if (!selected) {
    return {
      backgroundColor: 'transparent',
      color: '#4b5563',
      borderColor: '#d1d5db',
      borderStyle,
      '&:hover': { backgroundColor: '#f3f4f6', borderColor: '#9ca3af', borderStyle },
    }
  }
  return {
    backgroundColor: option.color,
    color: '#ffffff',
    borderColor: option.color,
    '&:hover': { backgroundColor: option.color, opacity: 0.9 },
  }
}

// Fecha de hoy en formato AAAA-MM-DD, con la hora local
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

export const DailyAttendancePage = () => {
  const today = todayIso()
  const canEditPast = EDIT_PAST_ROLES.includes(currentRole() ?? '')

  const [sections, setSections] = useState<AttendanceSection[]>([])
  const [sectionsError, setSectionsError] = useState<string | null>(null)

  // Filtros elegidos y la búsqueda confirmada con "Buscar"
  const [grade, setGrade] = useState<number | ''>('')
  const [sectionId, setSectionId] = useState('')
  const [date, setDate] = useState(today)
  const [search, setSearch] = useState<{ sectionId: string; date: string } | null>(null)

  const [marks, setMarks] = useState<Record<string, DailyMark>>({})
  // true cuando la dirección o la administración tocó "Editar" en un día anterior
  const [editingPast, setEditingPast] = useState(false)
  // Menú de la R: para qué alumno se está eligiendo el retardo
  const [lateMenu, setLateMenu] = useState<{ anchor: HTMLElement; studentId: string } | null>(null)
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { loading, saving, error, students, fetchAttendanceByDate, submitBatchAttendance } =
    useAttendance(search?.sectionId ?? '')

  // Secciones del ciclo lectivo activo
  useEffect(() => {
    const controller = new AbortController()
    attendanceService
      .getSummarySections(controller.signal)
      .then(setSections)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setSectionsError(err instanceof Error ? err.message : 'No se pudieron cargar los cursos')
      })
    return () => controller.abort()
  }, [])

  const grades = useMemo(
    () => [...new Set(sections.map((section) => section.grade))].sort((a, b) => a - b),
    [sections]
  )
  const gradeSections = sections.filter((section) => section.grade === grade)

  // Si hay dos secciones con la misma letra (distinto turno), se aclara el turno
  const sectionOptionLabel = (section: AttendanceSection) =>
    gradeSections.filter((item) => item.division === section.division).length > 1
      ? `${section.division} · ${SHIFT_LABELS[section.shift] ?? section.shift}`
      : section.division

  // Al buscar, se traen los alumnos y lo que ya está registrado ese día
  useEffect(() => {
    if (!search) return
    let active = true
    void fetchAttendanceByDate(search.date).then((data) => {
      if (!active || !data) return
      const loaded: Record<string, DailyMark> = {}
      data.records.forEach((record) => {
        loaded[record.studentId] = fromRecord(record)
      })
      setMarks(loaded)
    })
    return () => {
      active = false
    }
  }, [search, fetchAttendanceByDate])

  const searchedSection = sections.find((section) => section.id === search?.sectionId)
  const isToday = search?.date === today
  const isPast = Boolean(search) && !isToday
  // Hoy se carga normalmente; un día anterior, solo al tocar "Editar" (dirección o administración)
  const canEdit =
    Boolean(search) && !isWeekend(search?.date ?? today) && (isToday || (canEditPast && editingPast))
  const markedCount = students.filter((student) => marks[student.id]).length
  const pendingCount = students.length - markedCount
  const pageStudents = students.slice(page * rowsPerPage, (page + 1) * rowsPerPage)

  // Reglas de la fecha: no días futuros ni fines de semana
  const dateError =
    date > today
      ? 'No se puede tomar asistencia de días futuros.'
      : isWeekend(date)
        ? 'No se toma asistencia los sábados ni los domingos.'
        : null

  function handleSearch() {
    if (!sectionId || dateError) return
    setSearch({ sectionId, date })
    setMarks({})
    setEditingPast(false)
    setPage(0)
  }

  // Cancelar la corrección: vuelve a traer lo guardado y deja la pantalla en solo lectura
  function cancelEditing() {
    setEditingPast(false)
    if (search) setSearch({ ...search })
  }

  function handleButton(event: React.MouseEvent<HTMLElement>, studentId: string, button: ButtonKey) {
    if (button === 'R') {
      setLateMenu({ anchor: event.currentTarget, studentId })
      return
    }
    setMarks((prev) => ({ ...prev, [studentId]: button }))
  }

  function chooseLate(mark: 'R' | 'RH') {
    if (!lateMenu) return
    setMarks((prev) => ({ ...prev, [lateMenu.studentId]: mark }))
    setLateMenu(null)
  }

  function markAllPresent() {
    setMarks(Object.fromEntries(students.map((student) => [student.id, 'P' as DailyMark])))
    setSnackbar({ message: 'Se marcó a todos los alumnos como presentes.', severity: 'info' })
  }

  async function saveAttendance() {
    if (!search || pendingCount > 0) return
    const entries = students.map((student) => toEntry(student.id, marks[student.id]))
    try {
      await submitBatchAttendance(search.date, entries)
      setSnackbar({
        message: isPast ? 'Asistencia corregida.' : 'Asistencia guardada.',
        severity: 'success',
      })
      setEditingPast(false)
    } catch (err: unknown) {
      setSnackbar({
        message: err instanceof Error ? err.message : 'No se pudo guardar la asistencia.',
        severity: 'error',
      })
    }
  }

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1280, mx: 'auto', p: 1 }}>
        <PageHeader
          title="Carga diaria de asistencia"
          subtitle="Registrá la asistencia de los alumnos por curso y sección."
          breadcrumbs={[
            { label: 'Inicio', href: '/home' },
            { label: 'Asistencia' },
            { label: 'Carga diaria' },
          ]}
        />

        {/* Selección de curso, sección y fecha */}
        <ContentCard sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#374151' }}>
            Seleccionar curso y fecha
          </Typography>
          <Stack
            sx={{ alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}
          >
            <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
              <InputLabel id="lbl-course">Curso</InputLabel>
              <Select
                labelId="lbl-course"
                label="Curso"
                value={grade}
                onChange={(event) => {
                  setGrade(Number(event.target.value))
                  setSectionId('')
                }}
              >
                {grades.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}° Año
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140, flex: 1 }} disabled={grade === ''}>
              <InputLabel id="lbl-section">Sección</InputLabel>
              <Select
                labelId="lbl-section"
                label="Sección"
                value={sectionId}
                onChange={(event) => setSectionId(event.target.value)}
              >
                {gradeSections.map((section) => (
                  <MenuItem key={section.id} value={section.id}>
                    {sectionOptionLabel(section)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              type="date"
              size="small"
              label="Fecha"
              value={date}
              onChange={(event) => event.target.value && setDate(event.target.value)}
              error={Boolean(dateError)}
              helperText={dateError ?? ' '}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }}
              sx={{ minWidth: 180 }}
            />

            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={!sectionId || Boolean(dateError)}
              sx={{ px: 3, height: 40 }}
            >
              Buscar
            </Button>
          </Stack>
        </ContentCard>

        {/* Los errores sí se muestran en rojo: comunican algo que hay que resolver */}
        {sectionsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {sectionsError}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {search && searchedSection && (
          <ContentCard>
            {/* Barra de estado para días anteriores: solo lectura o corrección */}
            {isPast && (
              <Box
                sx={{
                  m: 2,
                  mb: 0,
                  px: 2,
                  py: 1.25,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  flexWrap: 'wrap',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderLeft: `3px solid ${editingPast ? '#b45309' : '#9ca3af'}`,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" sx={{ color: '#374151' }}>
                  {editingPast
                    ? `Corrigiendo la asistencia del ${formatDate(search.date)}. Al guardar, queda registrado quién hizo el cambio.`
                    : canEditPast
                      ? 'Día anterior: la asistencia está en solo lectura.'
                      : 'Día anterior: solo lectura. La dirección o la administración pueden corregirlo.'}
                </Typography>
                {canEditPast && !editingPast && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setEditingPast(true)}
                  >
                    Editar
                  </Button>
                )}
                {editingPast && (
                  <Button variant="outlined" size="small" onClick={cancelEditing} disabled={saving}>
                    Cancelar
                  </Button>
                )}
              </Box>
            )}

            {/* Encabezado de la lista y leyenda */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1.5,
                }}
              >
                <Typography variant="body2" sx={{ color: '#202124', fontWeight: 700 }}>
                  {searchedSection.grade}° Año — Sección {searchedSection.division} —{' '}
                  {formatDate(search.date)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
                  {students.length} alumnos
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                {BUTTONS.map((option) => (
                  <Box key={option.value} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: 0.5,
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...(option.value === 'J'
                          ? { border: '1px dashed #6b7280', color: '#374151' }
                          : { backgroundColor: option.color, color: '#ffffff' }),
                      }}
                    >
                      {option.value}
                    </Box>
                    <Typography variant="caption" sx={{ color: '#4b5563' }}>
                      {option.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={48}>#</TableCell>
                    <TableCell>DNI</TableCell>
                    <TableCell>Apellido y nombre</TableCell>
                    <TableCell align="right">Asistencia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#6b7280' }}>
                        La sección no tiene alumnos inscriptos en esta fecha.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageStudents.map((student, index) => (
                      <TableRow key={student.id} hover>
                        <TableCell sx={{ color: '#9ca3af' }}>
                          {page * rowsPerPage + index + 1}
                        </TableCell>
                        <TableCell sx={{ color: '#6b7280' }}>{student.dni}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#111827' }}>
                          {student.lastName}, {student.firstName}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            {BUTTONS.map((option) => {
                              const mark = marks[student.id]
                              return (
                                <Tooltip key={option.value} title={option.label} arrow>
                                  <span>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      disabled={!canEdit}
                                      onClick={(event) => handleButton(event, student.id, option.value)}
                                      sx={{
                                        minWidth: 40,
                                        height: 30,
                                        p: 0,
                                        fontWeight: 700,
                                        borderRadius: 1,
                                        boxShadow: 'none',
                                        ...getButtonStyle(isSelected(option.value, mark), option),
                                      }}
                                    >
                                      {buttonText(option.value, mark)}
                                    </Button>
                                  </span>
                                </Tooltip>
                              )
                            })}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginado y acciones */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 2,
                py: 1,
                gap: 1,
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <StandardTablePagination
                count={students.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={(rows) => {
                  setRowsPerPage(rows)
                  setPage(0)
                }}
                itemLabel="alumnos"
              />

              {canEdit && (
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  {pendingCount > 0 && students.length > 0 && (
                    <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 600 }}>
                      Faltan registrar {pendingCount} alumnos
                    </Typography>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={<CheckIcon />}
                    onClick={markAllPresent}
                    disabled={students.length === 0 || saving}
                  >
                    Marcar todos presentes
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={
                      saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />
                    }
                    onClick={() => void saveAttendance()}
                    disabled={students.length === 0 || pendingCount > 0 || saving}
                  >
                    {saving ? 'Guardando...' : isPast ? 'Guardar corrección' : 'Guardar asistencia'}
                  </Button>
                </Stack>
              )}
            </Box>
          </ContentCard>
        )}
      </Box>

      {/* Menú de la R: retardo de ¼ o de ½ falta */}
      <Menu anchorEl={lateMenu?.anchor} open={lateMenu !== null} onClose={() => setLateMenu(null)}>
        <MenuItem onClick={() => chooseLate('R')}>Retardo ¼ de falta</MenuItem>
        <MenuItem onClick={() => chooseLate('RH')}>Retardo ½ falta</MenuItem>
      </Menu>

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

export default DailyAttendancePage