// src/pages/GrillaCalificacionesPage.tsx
import React, { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
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
// Cuando existan los endpoints, descomentar para usar el servicio real:
// import { fetchApi } from '../services/api'

/*
  Pantalla  "Grilla de calificaciones" (EduTrack / Aura) — ISFDyT Nº 166.

  Funciona con DATOS DE PRUEBA (mock, en gradesMock.ts). Los selectores y la
  lista de alumnos saldrán de sus endpoints (cursos, materias, estudiantes)
  cuando existan. El guardado se conecta a POST /api/grades en el punto
  marcado "== ENCHUFE API ==".

  El modelo del back guarda tres notas por materia: 1° cuatrimestre (term1Score),
  2° cuatrimestre (term2Score) y nota final (finalScore); por eso hay 3 columnas.
*/

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

export const GrillaCalificacionesPage: React.FC = () => {
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
    // == ENCHUFE API == acá iría un GET de calificaciones para el nuevo curso/materia
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // == ENCHUFE API ==
    // En el back, cada calificación (Grade) cuelga de la inscripción del alumno
    // a la materia (enrollment). El llamado real necesita el enrollmentId de cada
    // alumno (endpoint de inscripciones) y luego manda las tres notas a POST /grades.
    console.log('Guardar calificaciones →', payload)

    const subject = SUBJECTS.find((s) => s.id === subjectId)
    setNotice({
      type: 'success',
      text: `Se guardarían las notas de ${payload.length} alumno(s) en ${subject?.name ?? ''}. (Ver la consola para el detalle.)`,
    })

    setModified(new Set())
  }

  const currentCourse = COURSES.find((c) => c.id === courseId)
  const currentSubject = SUBJECTS.find((s) => s.id === subjectId)

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
       
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Carga de calificaciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresá las notas de cada cuatrimestre y la calificación final
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
            sx={{
              flexShrink: 0,
              '& .MuiToggleButton-root': {
                color: '#1a1a1a',
                borderColor: '#1a1a1a',
                '&.Mui-selected': {
                  bgcolor: '#1a1a1a',
                  color: '#fff',
                  '&:hover': { bgcolor: '#000' },
                },
              },
            }}
          >
            <ToggleButton value="edit">Edición</ToggleButton>
            <ToggleButton value="view">Consulta</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Selectores */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
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

            <FormControl size="small" sx={{ minWidth: 200 }}>
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

            <FormControl size="small" sx={{ minWidth: 110 }}>
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

        {/* Grilla */}
        <TableContainer component={Paper} variant="outlined">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {currentCourse?.name} · {currentSubject?.name} · {year}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Escala: 1 a 10
            </Typography>
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={44} align="right">
                  #
                </TableCell>
                <TableCell>Apellido y Nombre</TableCell>
                <TableCell width={120}>DNI</TableCell>
                {COLUMNS.map(({ field, label }) => (
                  <TableCell key={field} width={90} align="center">
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {pageStudents.map((student, i) => (
                <TableRow key={student.id} hover>
                  <TableCell align="right" sx={{ color: 'text.disabled' }}>
                    {(page - 1) * PAGE_SIZE + i + 1}
                  </TableCell>
                  <TableCell>
                    {student.lastName}, {student.firstName}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{student.dni}</TableCell>
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

            <TableFooter>
              <TableRow>
                <TableCell />
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Promedio de la materia
                </TableCell>
                <TableCell />
                {COLUMNS.map(({ field }) => (
                  <TableCell
                    key={field}
                    align="center"
                    sx={{ fontWeight: 700, color: 'text.primary' }}
                  >
                    {averages[field] ?? '—'}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1.5,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Página {page} de {totalPages}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              sx={{ color: '#1a1a1a', borderColor: '#1a1a1a' }}
            >
              Anterior
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              sx={{ color: '#1a1a1a', borderColor: '#1a1a1a' }}
            >
              Siguiente
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            width: '100%',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {filledCount} de {totalCells} notas cargadas
          </Typography>

          {!readOnly && (
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={clearGrades}
                sx={{
                  color: '#1a1a1a',
                  borderColor: '#1a1a1a',
                  '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' },
                }}
              >
                Limpiar
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveGrades}
                sx={{
                  bgcolor: '#1a1a1a',
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#000', boxShadow: 'none' },
                }}
              >
                Guardar calificaciones
              </Button>
            </Box>
          )}
        </Box>

        {notice && (
          <Typography
            variant="body2"
            sx={{ mt: 1.5, color: notice.type === 'success' ? '#1a7f37' : 'text.secondary' }}
          >
            {notice.text}
          </Typography>
        )}
      </Box>
    </MainLayout>
  )
}

export default GrillaCalificacionesPage
