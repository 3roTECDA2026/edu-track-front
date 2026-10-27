import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Chip,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

import MainLayout from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import CustomTabs from '@/components/common/CustomTabs'
import AddButton from '@/components/common/AddButton'
import { StandardTablePagination } from '@/components/common/StandardTablePagination'
import { TeacherAssignmentsTab } from '@/components/teacherAssignments/TeacherAssignmentsTab'

// Interfaces de Cursos
interface CourseSection {
  id: string
  year: string
  section: string
  shift: string
  enrolled: number
  capacity: number
  preceptor: string
}

// Interfaces de Materias
interface Subject {
  id: string
  name: string
  evaluationType: 'Cuatrimestral' | 'Recuperatorio'
  weeklyHours: number
  years: string
}

// Datos de prueba iniciales para Cursos
const initialCourses: CourseSection[] = [
  {
    id: '1',
    year: '1° Año',
    section: 'A',
    shift: 'Mañana',
    enrolled: 32,
    capacity: 35,
    preceptor: 'Lucía Fernández',
  },
  {
    id: '2',
    year: '1° Año',
    section: 'B',
    shift: 'Mañana',
    enrolled: 30,
    capacity: 35,
    preceptor: 'Lucía Fernández',
  },
  {
    id: '3',
    year: '2° Año',
    section: 'A',
    shift: 'Mañana',
    enrolled: 28,
    capacity: 35,
    preceptor: '',
  },
  {
    id: '4',
    year: '2° Año',
    section: 'B',
    shift: 'Tarde',
    enrolled: 25,
    capacity: 30,
    preceptor: '',
  },
  {
    id: '5',
    year: '3° Año',
    section: 'A',
    shift: 'Mañana',
    enrolled: 28,
    capacity: 30,
    preceptor: 'Carlos Méndez',
  },
  {
    id: '6',
    year: '4° Año',
    section: 'A',
    shift: 'Mañana',
    enrolled: 27,
    capacity: 30,
    preceptor: 'Carlos Méndez',
  },
  {
    id: '7',
    year: '5° Año',
    section: 'A',
    shift: 'Mañana',
    enrolled: 22,
    capacity: 30,
    preceptor: '',
  },
]

// Datos de prueba iniciales para Materias
const initialSubjects: Subject[] = [
  {
    id: '1',
    name: 'Lengua y Literatura',
    evaluationType: 'Cuatrimestral',
    weeklyHours: 5,
    years: '1° a 5°',
  },
  {
    id: '2',
    name: 'Matemática',
    evaluationType: 'Cuatrimestral',
    weeklyHours: 5,
    years: '1° a 5°',
  },
  {
    id: '3',
    name: 'Ciencias Naturales',
    evaluationType: 'Cuatrimestral',
    weeklyHours: 4,
    years: '1° a 3°',
  },
  {
    id: '4',
    name: 'Ciencias Sociales',
    evaluationType: 'Cuatrimestral',
    weeklyHours: 4,
    years: '1° a 3°',
  },
  {
    id: '5',
    name: 'Educación Física',
    evaluationType: 'Recuperatorio',
    weeklyHours: 3,
    years: '1° a 5°',
  },
  { id: '6', name: 'Inglés', evaluationType: 'Cuatrimestral', weeklyHours: 3, years: '1° a 5°' },
  {
    id: '7',
    name: 'Tecnología',
    evaluationType: 'Recuperatorio',
    weeklyHours: 2,
    years: '1° a 3°',
  },
  {
    id: '8',
    name: 'Artes Visuales',
    evaluationType: 'Recuperatorio',
    weeklyHours: 2,
    years: '1° a 3°',
  },
  {
    id: '9',
    name: 'Formación Ética y Ciudadana',
    evaluationType: 'Cuatrimestral',
    weeklyHours: 2,
    years: '4° a 5°',
  },
]

// Barra superior de cada pestaña, con el botón de alta a la derecha
const toolbarSx = {
  display: 'flex',
  justifyContent: 'flex-end',
  p: 2,
  borderBottom: '1px solid #e5e7eb',
} as const

export const CoursesPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0)

  // Estados de Cursos
  const [courses, setCourses] = useState<CourseSection[]>(initialCourses)
  const [coursePage, setCoursePage] = useState(0)
  const [courseRowsPerPage, setCourseRowsPerPage] = useState(10)
  const [openCourseModal, setOpenCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseSection | null>(null)
  const [courseForm, setCourseForm] = useState({
    year: '1° Año',
    section: 'A',
    shift: 'Mañana',
    enrolled: 0,
    capacity: 30,
    preceptor: '',
  })

  // Estados de Materias
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects)
  const [subjectPage, setSubjectPage] = useState(0)
  const [subjectRowsPerPage, setSubjectRowsPerPage] = useState(10)
  const [openSubjectModal, setOpenSubjectModal] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [subjectForm, setSubjectForm] = useState<{
    name: string
    evaluationType: 'Cuatrimestral' | 'Recuperatorio'
    weeklyHours: number
    years: string
  }>({
    name: '',
    evaluationType: 'Cuatrimestral',
    weeklyHours: 4,
    years: '1° a 5°',
  })

  // Estados para Eliminación
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [deletingTarget, setDeletingTarget] = useState<{
    id: string
    type: 'course' | 'subject'
  } | null>(null)

  // --- LÓGICA DE CURSOS ---
  const handleOpenCourseCreate = () => {
    setEditingCourse(null)
    setCourseForm({
      year: '1° Año',
      section: 'A',
      shift: 'Mañana',
      enrolled: 0,
      capacity: 30,
      preceptor: '',
    })
    setOpenCourseModal(true)
  }

  const handleOpenCourseEdit = (course: CourseSection) => {
    setEditingCourse(course)
    setCourseForm({
      year: course.year,
      section: course.section,
      shift: course.shift,
      enrolled: course.enrolled,
      capacity: course.capacity,
      preceptor: course.preceptor,
    })
    setOpenCourseModal(true)
  }

  const handleSaveCourse = () => {
    if (editingCourse) {
      setCourses((prev) =>
        prev.map((item) => (item.id === editingCourse.id ? { ...item, ...courseForm } : item))
      )
    } else {
      setCourses((prev) => [...prev, { id: Date.now().toString(), ...courseForm }])
    }
    setOpenCourseModal(false)
  }

  // --- LÓGICA DE MATERIAS ---
  const handleOpenSubjectCreate = () => {
    setEditingSubject(null)
    setSubjectForm({ name: '', evaluationType: 'Cuatrimestral', weeklyHours: 4, years: '1° a 5°' })
    setOpenSubjectModal(true)
  }

  const handleOpenSubjectEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setSubjectForm({
      name: subject.name,
      evaluationType: subject.evaluationType,
      weeklyHours: subject.weeklyHours,
      years: subject.years,
    })
    setOpenSubjectModal(true)
  }

  const handleSaveSubject = () => {
    if (editingSubject) {
      setSubjects((prev) =>
        prev.map((item) => (item.id === editingSubject.id ? { ...item, ...subjectForm } : item))
      )
    } else {
      setSubjects((prev) => [...prev, { id: Date.now().toString(), ...subjectForm }])
    }
    setOpenSubjectModal(false)
  }

  // --- ELIMINACIÓN GENÉRICA ---
  const handleOpenDelete = (id: string, type: 'course' | 'subject') => {
    setDeletingTarget({ id, type })
    setOpenDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    if (deletingTarget) {
      if (deletingTarget.type === 'course') {
        setCourses((prev) => prev.filter((item) => item.id !== deletingTarget.id))
        setCoursePage(0)
      } else {
        setSubjects((prev) => prev.filter((item) => item.id !== deletingTarget.id))
        setSubjectPage(0)
      }
    }
    setOpenDeleteModal(false)
    setDeletingTarget(null)
  }

  const paginatedCourses = courses.slice(
    coursePage * courseRowsPerPage,
    coursePage * courseRowsPerPage + courseRowsPerPage
  )
  const paginatedSubjects = subjects.slice(
    subjectPage * subjectRowsPerPage,
    subjectPage * subjectRowsPerPage + subjectRowsPerPage
  )

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Estructura institucional"
          subtitle="Definí los cursos, secciones y materias de la institución."
          breadcrumbs={[
            { label: 'Inicio', href: '/home' },
            { label: 'Configuración' },
            { label: 'Estructura institucional' },
          ]}
        />

        {/* Tarjeta contenedora estándar con las pestañas */}
        <ContentCard>
          <CustomTabs
            tabs={['Cursos y secciones', 'Materias', 'Asignación docente']}
            value={currentTab}
            onChange={(_, next) => setCurrentTab(next)}
          />

          {/* PESTAÑA 0: CURSOS Y SECCIONES */}
          {currentTab === 0 && (
            <Box>
              <Box sx={toolbarSx}>
                <AddButton label="Nuevo curso" onClick={handleOpenCourseCreate} />
              </Box>

              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Año</TableCell>
                      <TableCell>Sección</TableCell>
                      <TableCell>Turno</TableCell>
                      <TableCell>Alumnos inscriptos</TableCell>
                      <TableCell>Capacidad</TableCell>
                      <TableCell>Preceptor asignado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedCourses.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: '#111827' }}>{row.year}</TableCell>
                        <TableCell sx={{ color: '#374151' }}>{row.section}</TableCell>
                        <TableCell sx={{ color: '#374151' }}>{row.shift}</TableCell>
                        <TableCell sx={{ color: '#374151' }}>{row.enrolled}</TableCell>
                        <TableCell sx={{ color: '#374151' }}>{row.capacity}</TableCell>
                        <TableCell sx={{ color: row.preceptor ? '#374151' : '#9ca3af' }}>
                          {row.preceptor || '— Sin asignar'}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenCourseEdit(row)}
                              sx={{ color: '#374151' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDelete(row.id, 'course')}
                              sx={{ color: '#dc2626' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <StandardTablePagination
                count={courses.length}
                page={coursePage}
                rowsPerPage={courseRowsPerPage}
                onPageChange={setCoursePage}
                onRowsPerPageChange={(rows) => {
                  setCourseRowsPerPage(rows)
                  setCoursePage(0)
                }}
                itemLabel="cursos"
                sx={{ borderTop: '1px solid #e5e7eb' }}
              />
            </Box>
          )}

          {/* PESTAÑA 1: MATERIAS */}
          {currentTab === 1 && (
            <Box>
              <Box sx={toolbarSx}>
                <AddButton label="Nueva materia" onClick={handleOpenSubjectCreate} />
              </Box>

              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Materia</TableCell>
                      <TableCell>Tipo de evaluación</TableCell>
                      <TableCell>Horas semanales</TableCell>
                      <TableCell>Años que cursa</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedSubjects.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: '#111827' }}>{row.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.evaluationType}
                            size="small"
                            sx={{
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              fontWeight: 500,
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              fontSize: '0.8rem',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#374151' }}>{row.weeklyHours} hs</TableCell>
                        <TableCell sx={{ color: '#374151' }}>{row.years}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenSubjectEdit(row)}
                              sx={{ color: '#374151' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDelete(row.id, 'subject')}
                              sx={{ color: '#dc2626' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <StandardTablePagination
                count={subjects.length}
                page={subjectPage}
                rowsPerPage={subjectRowsPerPage}
                onPageChange={setSubjectPage}
                onRowsPerPageChange={(rows) => {
                  setSubjectRowsPerPage(rows)
                  setSubjectPage(0)
                }}
                itemLabel="materias"
                sx={{ borderTop: '1px solid #e5e7eb' }}
              />
            </Box>
          )}

          {/* PESTAÑA 2: ASIGNACIÓN DOCENTE */}
          {currentTab === 2 && <TeacherAssignmentsTab />}
        </ContentCard>
      </PageContainer>

      {/* MODAL CURSOS (Crear/Editar) */}
      <Dialog
        open={openCourseModal}
        onClose={() => setOpenCourseModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingCourse ? 'Editar curso / sección' : 'Nuevo curso / sección'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Año"
              select
              fullWidth
              value={courseForm.year}
              onChange={(e) => setCourseForm({ ...courseForm, year: e.target.value })}
            >
              {['1° Año', '2° Año', '3° Año', '4° Año', '5° Año', '6° Año'].map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Sección"
              fullWidth
              value={courseForm.section}
              onChange={(e) => setCourseForm({ ...courseForm, section: e.target.value })}
              placeholder="Ej. A, B, C"
            />
            <TextField
              label="Turno"
              select
              fullWidth
              value={courseForm.shift}
              onChange={(e) => setCourseForm({ ...courseForm, shift: e.target.value })}
            >
              {['Mañana', 'Tarde', 'Noche'].map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Capacidad"
              type="number"
              fullWidth
              value={courseForm.capacity}
              onChange={(e) => setCourseForm({ ...courseForm, capacity: Number(e.target.value) })}
            />
            <TextField
              label="Preceptor asignado"
              fullWidth
              value={courseForm.preceptor}
              onChange={(e) => setCourseForm({ ...courseForm, preceptor: e.target.value })}
              placeholder="Dejar vacío si no está asignado"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenCourseModal(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSaveCourse} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL MATERIAS (Crear/Editar) */}
      <Dialog
        open={openSubjectModal}
        onClose={() => setOpenSubjectModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingSubject ? 'Editar materia' : 'Nueva materia'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre de la materia"
              fullWidth
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              placeholder="Ej. Matemática, Lengua..."
            />
            <TextField
              label="Tipo de evaluación"
              select
              fullWidth
              value={subjectForm.evaluationType}
              onChange={(e) =>
                setSubjectForm({
                  ...subjectForm,
                  evaluationType: e.target.value as 'Cuatrimestral' | 'Recuperatorio',
                })
              }
            >
              <MenuItem value="Cuatrimestral">Cuatrimestral</MenuItem>
              <MenuItem value="Recuperatorio">Recuperatorio</MenuItem>
            </TextField>
            <TextField
              label="Horas semanales"
              type="number"
              fullWidth
              value={subjectForm.weeklyHours}
              onChange={(e) =>
                setSubjectForm({ ...subjectForm, weeklyHours: Number(e.target.value) })
              }
            />
            <TextField
              label="Años que cursa"
              fullWidth
              value={subjectForm.years}
              onChange={(e) => setSubjectForm({ ...subjectForm, years: e.target.value })}
              placeholder="Ej. 1° a 5°, 1° a 3°"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenSubjectModal(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSaveSubject} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      <Dialog
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {deletingTarget?.type === 'course' ? '¿Eliminar curso?' : '¿Eliminar materia?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Esta acción dará de baja el registro seleccionado del sistema. ¿Deseás continuar?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDeleteModal(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  )
}

export default CoursesPage
