import React, { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import MainLayout from '../components/layout/MainLayout'
import {
  COURSES,
  SUBJECTS,
  STUDENTS,
  INITIAL_GRADES,
  YEARS,
  type Field,
  type GradesMap,
} from './gradesMock'

type Mode = 'edit' | 'view'
type Level = 'low' | 'mid' | 'high' | 'empty'

const PAGE_SIZE = 10

const COLUMNS: { field: Field; label: string }[] = [
  { field: 'term1Score', label: '1° Cuatri' },
  { field: 'term2Score', label: '2° Cuatri' },
  { field: 'finalScore', label: 'Final' },
]

const gradeKey = (studentId: string, subjectId: string, year: number, field: Field) =>
  `${studentId}|${subjectId}|${year}|${field}`

function gradeLevel(value: number | undefined): Level {
  if (value === undefined) return 'empty'
  if (value < 4) return 'low'
  if (value <= 6) return 'mid'
  return 'high'
}

const COLORS: Record<Level, { bg: string; fg: string; bd: string }> = {
  low: { bg: '#fdecec', fg: '#b42318', bd: '#f0b4b4' },
  mid: { bg: '#fdf6e3', fg: '#8a6a00', bd: '#eddca0' },
  high: { bg: '#e9f7ee', fg: '#1a7f37', bd: '#a9e0bd' },
  empty: { bg: 'transparent', fg: 'text.disabled', bd: 'divider' },
}

export const CalificationGridPage: React.FC = () => {
  const [courseId, setCourseId] = useState<string>('c1')
  const [subjectId, setSubjectId] = useState<string>('m1')
  const [year, setYear] = useState<number>(2026)
  const [mode, setMode] = useState<Mode>('edit')
  const [page, setPage] = useState<number>(1)

  const [grades, setGrades] = useState<GradesMap>(INITIAL_GRADES)
  const [modified, setModified] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState<{ type: 'success' | 'info'; text: string } | null>(null)

  const inputsRef = useRef<Record<Field, Array<HTMLInputElement | null>>>({
    term1Score: [],
    term2Score: [],
    finalScore: [],
  })

  const readOnly = mode === 'view'

  const courseSubjects = useMemo(
    () => SUBJECTS.filter((s) => s.courseId === courseId),
    [courseId],
  )

  const courseStudents = useMemo(
    () =>
      STUDENTS.filter((s) => s.courseId === courseId).sort((a, b) =>
        a.lastName.localeCompare(b.lastName, 'es'),
      ),
    [courseId],
  )

  const totalPages = Math.max(1, Math.ceil(courseStudents.length / PAGE_SIZE))
  const pageStudents = courseStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const readGrade = (studentId: string, field: Field): number | undefined =>
    grades[gradeKey(studentId, subjectId, year, field)]

  function changeCourse(nextCourse: string) {
    setCourseId(nextCourse)
    const firstSubject = SUBJECTS.find((s) => s.courseId === nextCourse)
    setSubjectId(firstSubject ? firstSubject.id : '')
    setPage(1)
    setNotice(null)
  }

  function editGrade(studentId: string, field: Field, raw: string) {
    const key = gradeKey(studentId, subjectId, year, field)

    if (raw.trim() === '') {
      setGrades((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
      setModified((prev) => new Set(prev).add(key))
      return
    }

    if (!/^\d{1,2}$/.test(raw)) return
    const value = Number(raw)
    if (value < 1 || value > 10) return

    setGrades((prev) => ({ ...prev, [key]: value }))
    setModified((prev) => new Set(prev).add(key))
    setNotice(null)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>, field: Field, rowIndex: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      inputsRef.current[field][rowIndex + 1]?.focus()
    }
  }

  const averages = useMemo(() => {
    const result: Record<Field, string | null> = {
      term1Score: null,
      term2Score: null,
      finalScore: null,
    }
    COLUMNS.forEach(({ field }) => {
      const values = courseStudents
        .map((s) => readGrade(s.id, field))
        .filter((v): v is number => typeof v === 'number')
      if (values.length > 0) {
        const sum = values.reduce((acc, v) => acc + v, 0)
        result[field] = (sum / values.length).toFixed(1)
      }
    })
    return result
  }, [courseStudents, grades, subjectId, year])

  const totalCells = courseStudents.length * COLUMNS.length
  const filledCount = courseStudents.reduce(
    (acc, s) => acc + COLUMNS.filter(({ field }) => readGrade(s.id, field) !== undefined).length,
    0,
  )

  function clearGrades() {
    setGrades((prev) => {
      const copy = { ...prev }
      courseStudents.forEach((s) => {
        COLUMNS.forEach(({ field }) => {
          const key = gradeKey(s.id, subjectId, year, field)
          const original = INITIAL_GRADES[key]
          if (original === undefined) delete copy[key]
          else copy[key] = original
        })
      })
      return copy
    })
    setModified((prev) => {
      const copy = new Set(prev)
      courseStudents.forEach((s) => {
        COLUMNS.forEach(({ field }) => copy.delete(gradeKey(s.id, subjectId, year, field)))
      })
      return copy
    })
    setNotice(null)
  }

  async function saveGrades() {
    const touchedStudents = new Set<string>()
    modified.forEach((key) => {
      const [studentId, sId, y] = key.split('|')
      if (sId === subjectId && y === String(year)) touchedStudents.add(studentId as string)
    })

    const payload = [...touchedStudents].map((studentId) => ({
      studentId,
      subjectId,
      year,
      term1Score: readGrade(studentId, 'term1Score') ?? null,
      term2Score: readGrade(studentId, 'term2Score') ?? null,
      finalScore: readGrade(studentId, 'finalScore') ?? null,
    }))

    if (payload.length === 0) {
      setNotice({ type: 'info', text: 'No hay cambios para guardar.' })
      return
    }

    const subject = SUBJECTS.find((s) => s.id === subjectId)
    setNotice({
      type: 'success',
      text: `Se guardaron las notas de ${payload.length} alumno(s) en ${subject?.name ?? ''}.`,
    })

    setModified(new Set())
  }

  const currentCourse = COURSES.find((c) => c.id === courseId)
  const currentSubject = SUBJECTS.find((s) => s.id === subjectId)

  return (
    <MainLayout>
      <Box className="grades-page" sx={{ maxWidth: 1280, mx: 'auto' }}>
        {/* Breadcrumb idéntico al de Attendance */}
        <Box className="print-hidden" sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ color: '#7b8794' }}>
            Inicio &nbsp;›&nbsp; Calificaciones &nbsp;›&nbsp; <strong>Carga de notas</strong>
          </Typography>
        </Box>

        {/* Encabezado principal */}
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#202124', fontWeight: 800, fontSize: { xs: '1.65rem', md: '2rem' } }}>
              Carga de calificaciones
            </Typography>
            <Typography variant="body2" sx={{ color: '#7b8794' }}>
              Ingresá las notas de cada cuatrimestre y la calificación final por materia.
            </Typography>
          </Box>

          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_, next: Mode | null) => {
              if (next) setMode(next)
            }}
            aria-label="Modo de la planilla"
            sx={{ flexShrink: 0 }}
          >
            <ToggleButton value="edit">Edición</ToggleButton>
            <ToggleButton value="view">Consulta</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {/* Selectores estilizados como AttendanceFilters */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: '#fafafa', borderColor: '#e1e5e8' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="lbl-course">Curso</InputLabel>
              <Select
                labelId="lbl-course"
                label="Curso"
                value={courseId}
                onChange={(e) => changeCourse(e.target.value)}
              >
                {COURSES.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="lbl-subject">Materia</InputLabel>
              <Select
                labelId="lbl-subject"
                label="Materia"
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value)
                  setPage(1)
                  setNotice(null)
                }}
              >
                {courseSubjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="lbl-year">Año</InputLabel>
              <Select
                labelId="lbl-year"
                label="Año"
                value={year}
                onChange={(e) => {
                  setYear(Number(e.target.value))
                  setPage(1)
                  setNotice(null)
                }}
              >
                {YEARS.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* Mensaje de alerta con estilo unificado */}
        {notice && (
          <Alert severity={notice.type === 'success' ? 'success' : 'info'} onClose={() => setNotice(null)} sx={{ mb: 2 }}>
            {notice.text}
          </Alert>
        )}

        {/* Barra de estado y acciones (estilo similar a la barra superior de AttendanceTable) */}
        <Stack className="print-hidden" direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 1.5, p: 1.5, backgroundColor: '#fafafa', border: '1px solid #e1e5e8', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: '#202124', fontWeight: 600 }}>
            {currentCourse?.name} · {currentSubject?.name} · Año {year}
          </Typography>

          {!readOnly && (
            <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, whiteSpace: 'nowrap' }}>
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={clearGrades}
                sx={{ textTransform: 'none', borderColor: '#555', color: '#333' }}
              >
                Limpiar
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveGrades}
                sx={{ textTransform: 'none', backgroundColor: '#1976d2', color: '#fff', '&:hover': { backgroundColor: '#115293' } }}
              >
                Guardar calificaciones
              </Button>
            </Stack>
          )}
        </Stack>

        {/* Grilla */}
        <TableContainer component={Paper} variant="outlined" sx={{ borderColor: '#e1e5e8' }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell width={44} align="right" sx={{ fontWeight: 700 }}>
                  #
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Apellido y Nombre</TableCell>
                <TableCell width={140} sx={{ fontWeight: 700 }}>DNI</TableCell>
                {COLUMNS.map(({ field, label }) => (
                  <TableCell key={field} width={100} align="center" sx={{ fontWeight: 700 }}>
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {pageStudents.map((student, i) => (
                <TableRow key={student.id} hover>
                  <TableCell align="right" sx={{ color: '#7b8794' }}>
                    {(page - 1) * PAGE_SIZE + i + 1}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#202124' }}>
                    {student.lastName}, {student.firstName}
                  </TableCell>
                  <TableCell sx={{ color: '#555' }}>{student.dni}</TableCell>
                  {COLUMNS.map(({ field }) => {
                    const value = readGrade(student.id, field)
                    const level = gradeLevel(value)
                    const color = COLORS[level]
                    return (
                      <TableCell key={field} align="center">
                        {readOnly ? (
                          <Chip
                            label={value ?? '—'}
                            size="small"
                            sx={{
                              minWidth: 44,
                              fontWeight: 600,
                              bgcolor: color.bg,
                              color: color.fg,
                              border: '1px solid',
                              borderColor: color.bd,
                            }}
                          />
                        ) : (
                          <TextField
                            size="small"
                            value={value ?? ''}
                            placeholder="—"
                            inputRef={(el: HTMLInputElement | null) => {
                              inputsRef.current[field][i] = el
                            }}
                            onChange={(e) => editGrade(student.id, field, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, field, i)}
                            slotProps={{
                              htmlInput: {
                                inputMode: 'numeric',
                                maxLength: 2,
                                'aria-label': `Nota de ${student.lastName}, ${student.firstName}`,
                                style: { textAlign: 'center', width: 40, fontWeight: 600 },
                              },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': { bgcolor: color.bg },
                              '& input': { color: color.fg },
                            }}
                          />
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>

            <TableFooter sx={{ backgroundColor: '#fafafa' }}>
              <TableRow>
                <TableCell />
                <TableCell sx={{ fontWeight: 700, color: '#202124' }}>
                  Promedio de la materia
                </TableCell>
                <TableCell />
                {COLUMNS.map(({ field }) => (
                  <TableCell
                    key={field}
                    align="center"
                    sx={{ fontWeight: 800, color: '#202124' }}
                  >
                    {averages[field] ?? '—'}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>

        {/* Paginación y contador inferior */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
            pt: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: '#7b8794' }}>
            {filledCount} de {totalCells} notas cargadas · Página {page} de {totalPages}
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              sx={{ textTransform: 'none', borderColor: '#555', color: '#333' }}
            >
              Anterior
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              sx={{ textTransform: 'none', borderColor: '#555', color: '#333' }}
            >
              Siguiente
            </Button>
          </Stack>
        </Box>
      </Box>
    </MainLayout>
  )
}

export default CalificationGridPage