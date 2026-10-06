import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
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
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import CheckIcon from '@mui/icons-material/Check'
import MainLayout from '../components/layout/MainLayout'

const COURSES = [
  { id: 'c1', name: '1° Año' },
  { id: 'c2', name: '2° Año' },
  { id: 'c3', name: '3° Año' },
  { id: 'c4', name: '4° Año' },
  { id: 'c5', name: '5° Año' },
]

const SECTIONS = ['A', 'B', 'C']

const STUDENTS = [
  { id: 's1', courseId: 'c1', sectionId: 'A', dni: '45.678.901', lastName: 'Pérez', firstName: 'Sofía Lucía' },
  { id: 's2', courseId: 'c1', sectionId: 'A', dni: '46.123.456', lastName: 'García', firstName: 'Mateo Nicolás' },
  { id: 's3', courseId: 'c1', sectionId: 'A', dni: '44.987.654', lastName: 'Rodríguez', firstName: 'Valentina' },
  { id: 's4', courseId: 'c1', sectionId: 'A', dni: '47.111.222', lastName: 'Martínez', firstName: 'Facundo' },
  { id: 's5', courseId: 'c1', sectionId: 'A', dni: '46.555.888', lastName: 'Luna', firstName: 'Camila' },
  { id: 's6', courseId: 'c1', sectionId: 'A', dni: '45.333.777', lastName: 'Díaz', firstName: 'Tomás Agustín' },
  { id: 's7', courseId: 'c1', sectionId: 'A', dni: '48.999.000', lastName: 'Romero', firstName: 'Agustina' },
]

type AttendanceState = 'present' | 'absent' | 'late' | 'justified' | 'empty'

const PAGE_SIZE = 10

const ATTENDANCE_OPTIONS: { value: AttendanceState; label: string }[] = [
  { value: 'present', label: 'P' },
  { value: 'absent', label: 'A' },
  { value: 'late', label: 'R' },
  { value: 'justified', label: 'J' },
]

const ATTENDANCE_COLORS: Record<string, { bg: string; fg: string; bd: string }> = {
  present: { bg: '#e9f7ee', fg: '#1a7f37', bd: '#a9e0bd' },
  absent: { bg: '#fdecec', fg: '#b42318', bd: '#f0b4b4' },
  late: { bg: '#fdf6e3', fg: '#8a6a00', bd: '#eddca0' },
  justified: { bg: '#e8f0fe', fg: '#1967d2', bd: '#d2e3fc' },
}

export const DailyAttendancePage: React.FC = () => {
  const [courseId, setCourseId] = useState<string>('c1')
  const [sectionId, setSectionId] = useState<string>('A')
  const [date, setDate] = useState<string>('2026-06-06')
  const [page, setPage] = useState<number>(1)

  const [attendance, setAttendance] = useState<Record<string, AttendanceState>>({})
  const [notice, setNotice] = useState<{ type: 'success' | 'info'; text: string } | null>(null)

  const courseStudents = useMemo(() => {
    return STUDENTS.filter((s) => s.courseId === courseId && s.sectionId === sectionId)
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'es'))
  }, [courseId, sectionId])

  const totalPages = Math.max(1, Math.ceil(courseStudents.length / PAGE_SIZE))
  const pageStudents = courseStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleAttendanceChange(studentId: string, state: AttendanceState) {
    const key = `${studentId}-${date}`
    setAttendance((prev) => ({
      ...prev,
      [key]: state,
    }))
    setNotice(null)
  }

  function markAllPresent() {
    setAttendance((prev) => {
      const copy = { ...prev }
      courseStudents.forEach((s) => {
        copy[`${s.id}-${date}`] = 'present'
      })
      return copy
    })
    setNotice({ type: 'info', text: 'Se marcó a todos los alumnos como presentes para la fecha seleccionada.' })
  }

  function saveAttendance() {
    setNotice({ type: 'success', text: '¡Asistencia guardada con éxito en el sistema!' })
  }

  const currentCourse = COURSES.find((c) => c.id === courseId)

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 3 } }}>
        {/* Breadcrumb unificado */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ color: '#7b8794' }}>
            Inicio &nbsp;›&nbsp; Asistencia &nbsp;›&nbsp; <strong>Carga diaria</strong>
          </Typography>
        </Box>

        {/* Encabezado principal resuelto con Box flex nativo para evitar cualquier error de tipado */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', md: 'center' }, 
            mb: 2,
            gap: 2 
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ color: '#202124', fontWeight: 800, fontSize: { xs: '1.65rem', md: '2rem' } }}>
              Carga diaria de asistencia
            </Typography>
            <Typography variant="body2" sx={{ color: '#7b8794' }}>
              Registrá la asistencia diaria por curso, sección y fecha seleccionada.
            </Typography>
          </Box>
        </Box>

        <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: '#fafafa', borderColor: '#e1e5e8' }}>
          <Stack sx={{ alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="lbl-course">Curso</InputLabel>
              <Select
                labelId="lbl-course"
                label="Curso"
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value)
                  setPage(1)
                  setNotice(null)
                }}
              >
                {COURSES.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="lbl-section">Sección</InputLabel>
              <Select
                labelId="lbl-section"
                label="Sección"
                value={sectionId}
                onChange={(e) => {
                  setSectionId(e.target.value)
                  setPage(1)
                  setNotice(null)
                }}
              >
                {SECTIONS.map((sec) => (
                  <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small">
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  setNotice(null)
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #c4c4c4',
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '0.875rem',
                  color: '#333',
                  backgroundColor: '#fff'
                }}
              />
            </FormControl>
          </Stack>
        </Paper>

        {/* Alertas dinámicas */}
        {notice && (
          <Alert severity={notice.type} onClose={() => setNotice(null)} sx={{ mb: 2 }}>
            {notice.text}
          </Alert>
        )}

        {/* Barra de Acciones */}
        <Box
          sx={{ 
            display: 'flex',
            mb: 1.5, 
            p: 1.5, 
            backgroundColor: '#fafafa', 
            border: '1px solid #e1e5e8', 
            borderRadius: 1,
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2
          }}
        >
          <Typography variant="body2" sx={{ color: '#202124', fontWeight: 600 }}>
            {currentCourse?.name} — Sección {sectionId} ({courseStudents.length} alumnos)
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<CheckIcon />}
              onClick={markAllPresent}
              sx={{ textTransform: 'none', borderColor: '#555', color: '#333' }}
            >
              Marcar todos presentes
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveAttendance}
              sx={{ textTransform: 'none', backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#115293' } }}
            >
              Guardar asistencia
            </Button>
          </Stack>
        </Box>

        {/* Tabla de Alumnos */}
        <TableContainer component={Paper} variant="outlined" sx={{ borderColor: '#e1e5e8' }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell width={44} align="right" sx={{ fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Apellido y Nombre</TableCell>
                <TableCell width={140} sx={{ fontWeight: 700 }}>DNI</TableCell>
                <TableCell align="center" width={260} sx={{ fontWeight: 700 }}>Opciones de Asistencia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageStudents.map((student, i) => {
                const currentState = attendance[`${student.id}-${date}`] || 'empty'
                return (
                  <TableRow key={student.id} hover>
                    <TableCell align="right" sx={{ color: '#7b8794' }}>
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#202124' }}>
                      {student.lastName}, {student.firstName}
                    </TableCell>
                    <TableCell sx={{ color: '#555' }}>{student.dni}</TableCell>
                    <TableCell align="center">

                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, justifyContent: 'center', alignItems: 'center' }}>
                   {ATTENDANCE_OPTIONS.map((opt) => {
                    const selected = currentState === opt.value
                    const color = ATTENDANCE_COLORS[opt.value]

                      return (
                      <Button
                      key={opt.value}
                      size="small"
                      variant={selected ? 'contained' : 'outlined'}
                      onClick={() => handleAttendanceChange(student.id, opt.value)}
                      sx={{
                      minWidth: 38,
                      height: 32,
                      padding: 0,
                      fontWeight: 700,
                      borderRadius: 1,
                      backgroundColor: selected ? color.bg : 'transparent',
                      color: selected ? color.fg : '#555',
                      borderColor: selected ? color.bd : '#d0d5dd',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: selected ? color.bg : '#f2f4f7',
                        borderColor: selected ? color.bd : '#98a2b3',
                        boxShadow: 'none',
                      },
                    }}
                  >
                {opt.label}
              </Button>
                      )
                    })}
                    </Box>
                    
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2 }}>
          <TablePagination
            rowsPerPageOptions={[10]}
            component="div"
            count={courseStudents.length}
            rowsPerPage={PAGE_SIZE}
            page={page - 1}
            onPageChange={(_, newPage) => setPage(newPage + 1)}
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </Box>
      </Box>
    </MainLayout>
  )
}

export default DailyAttendancePage