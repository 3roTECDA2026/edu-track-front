import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
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

// Las letras del wireframe y cómo se guardan en el back:
// P = presente · A = ausente (1 falta) · R = llegada tarde (cuarto de falta) · J = ausente justificado
type DailyMark = 'P' | 'A' | 'R' | 'J'

const MARK_OPTIONS: { value: DailyMark; label: string; color: string }[] = [
  { value: 'P', label: 'Presente', color: '#111827' },
  { value: 'A', label: 'Ausente', color: '#dc2626' },
  { value: 'R', label: 'Retardo (llegada tarde)', color: '#b45309' },
  { value: 'J', label: 'Justificado', color: '#2563eb' },
]

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
    case 'J':
      return { studentId, value: 'ABSENT', justified: true }
  }
}

// La media falta no tiene letra en el wireframe: si existiera un registro así, queda sin marcar
const fromRecord = (record: DailyAttendanceRecord): DailyMark | null => {
  if (record.value === 'PRESENT') return 'P'
  if (record.value === 'ABSENT') return record.justified ? 'J' : 'A'
  if (record.value === 'QUARTER') return 'R'
  return null
}

const getButtonStyle = (selected: boolean, option: (typeof MARK_OPTIONS)[number]) => {
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
  const [sections, setSections] = useState<AttendanceSection[]>([])
  const [sectionsError, setSectionsError] = useState<string | null>(null)

  // Filtros elegidos y la búsqueda confirmada con "Buscar"
  const [grade, setGrade] = useState<number | ''>('')
  const [sectionId, setSectionId] = useState('')
  const [date, setDate] = useState(today)
  const [search, setSearch] = useState<{ sectionId: string; date: string } | null>(null)

  const [marks, setMarks] = useState<Record<string, DailyMark>>({})
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
        const mark = fromRecord(record)
        if (mark) loaded[record.studentId] = mark
      })
      setMarks(loaded)
    })
    return () => {
      active = false
    }
  }, [search, fetchAttendanceByDate])

  const searchedSection = sections.find((section) => section.id === search?.sectionId)
  const isToday = search?.date === today
  const canEdit = Boolean(search) && isToday && !isWeekend(today)
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
    setPage(0)
  }

  function handleMark(studentId: string, mark: DailyMark) {
    setMarks((prev) => ({ ...prev, [studentId]: mark }))
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
      setSnackbar({ message: 'Asistencia guardada.', severity: 'success' })
    } catch (err: unknown) {
      setSnackbar({
        message: err instanceof Error ? err.message : 'No se pudo guardar la asistencia.',
        severity: 'error',
      })
    }
  }

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 3 } }}>
        <PageHeader
          title="Carga diaria de asistencia"
          subtitle="Registrá la asistencia de los alumnos por curso y sección."
          breadcrumbs={[
            { label: 'Inicio', href: '/' },
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
              sx={{
                backgroundColor: '#111827',
                px: 3,
                height: 40,
                '&:hover': { backgroundColor: '#1f2937' },
              }}
            >
              Buscar
            </Button>
          </Stack>
        </ContentCard>

        {/* Avisos fijos de la pantalla (no son mensajes de una acción) */}
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
        {search && !isToday && (
          <Alert severity="info" sx={{ mb: 2 }}>
            La asistencia de días anteriores solo se puede consultar: no se puede modificar.
          </Alert>
        )}

        {search && searchedSection && (
          <ContentCard>
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
                {MARK_OPTIONS.map((option) => (
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
                      {option.label.split(' (')[0]}
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
                            {MARK_OPTIONS.map((option) => (
                              <Tooltip key={option.value} title={option.label} arrow>
                                <span>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    disabled={!canEdit}
                                    onClick={() => handleMark(student.id, option.value)}
                                    sx={{
                                      minWidth: 34,
                                      height: 30,
                                      p: 0,
                                      fontWeight: 700,
                                      borderRadius: 1,
                                      boxShadow: 'none',
                                      ...getButtonStyle(marks[student.id] === option.value, option),
                                    }}
                                  >
                                    {option.value}
                                  </Button>
                                </span>
                              </Tooltip>
                            ))}
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
                    sx={{ borderColor: '#d1d5db', color: '#374151' }}
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
                    sx={{ backgroundColor: '#111827', '&:hover': { backgroundColor: '#1f2937' } }}
                  >
                    {saving ? 'Guardando...' : 'Guardar asistencia'}
                  </Button>
                </Stack>
              )}
            </Box>
          </ContentCard>
        )}
      </Box>

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
