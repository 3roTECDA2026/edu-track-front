import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MainLayout from '@/components/layout/MainLayout';
import CustomTabs from '@/components/common/CustomTabs';

// Interfaces de Cursos
interface CourseSection {
  id: string;
  year: string;
  section: string;
  shift: string;
  enrolled: number;
  capacity: number;
  preceptor: string;
}

// Interfaces de Materias
interface Subject {
  id: string;
  name: string;
  evaluationType: 'Cuatrimestral' | 'Recuperatorio';
  weeklyHours: number;
  years: string;
}

// Datos de prueba iniciales para Cursos
const initialCourses: CourseSection[] = [
  { id: '1', year: '1° Año', section: 'A', shift: 'Mañana', enrolled: 32, capacity: 35, preceptor: 'Lucía Fernández' },
  { id: '2', year: '1° Año', section: 'B', shift: 'Mañana', enrolled: 30, capacity: 35, preceptor: 'Lucía Fernández' },
  { id: '3', year: '2° Año', section: 'A', shift: 'Mañana', enrolled: 28, capacity: 35, preceptor: '' },
  { id: '4', year: '2° Año', section: 'B', shift: 'Tarde', enrolled: 25, capacity: 30, preceptor: '' },
  { id: '5', year: '3° Año', section: 'A', shift: 'Mañana', enrolled: 28, capacity: 30, preceptor: 'Carlos Méndez' },
  { id: '6', year: '4° Año', section: 'A', shift: 'Mañana', enrolled: 27, capacity: 30, preceptor: 'Carlos Méndez' },
  { id: '7', year: '5° Año', section: 'A', shift: 'Mañana', enrolled: 22, capacity: 30, preceptor: '' },
];

// Datos de prueba iniciales para Materias (basados en la imagen)
const initialSubjects: Subject[] = [
  { id: '1', name: 'Lengua y Literatura', evaluationType: 'Cuatrimestral', weeklyHours: 5, years: '1° a 5°' },
  { id: '2', name: 'Matemática', evaluationType: 'Cuatrimestral', weeklyHours: 5, years: '1° a 5°' },
  { id: '3', name: 'Ciencias Naturales', evaluationType: 'Cuatrimestral', weeklyHours: 4, years: '1° a 3°' },
  { id: '4', name: 'Ciencias Sociales', evaluationType: 'Cuatrimestral', weeklyHours: 4, years: '1° a 3°' },
  { id: '5', name: 'Educación Física', evaluationType: 'Recuperatorio', weeklyHours: 3, years: '1° a 5°' },
  { id: '6', name: 'Inglés', evaluationType: 'Cuatrimestral', weeklyHours: 3, years: '1° a 5°' },
  { id: '7', name: 'Tecnología', evaluationType: 'Recuperatorio', weeklyHours: 2, years: '1° a 3°' },
  { id: '8', name: 'Artes Visuales', evaluationType: 'Recuperatorio', weeklyHours: 2, years: '1° a 3°' },
  { id: '9', name: 'Formación Ética y Ciudadana', evaluationType: 'Cuatrimestral', weeklyHours: 2, years: '4° a 5°' },
];

export const CoursesPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  // Estados de Cursos
  const [courses, setCourses] = useState<CourseSection[]>(initialCourses);
  const [coursePage, setCoursePage] = useState(0);
  const [courseRowsPerPage, setCourseRowsPerPage] = useState(10);
  const [openCourseModal, setOpenCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseSection | null>(null);
  const [courseForm, setCourseForm] = useState({
    year: '1° Año',
    section: 'A',
    shift: 'Mañana',
    enrolled: 0,
    capacity: 30,
    preceptor: ''
  });

  // Estados de Materias
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [subjectPage, setSubjectPage] = useState(0);
  const [subjectRowsPerPage, setSubjectRowsPerPage] = useState(10);
  const [openSubjectModal, setOpenSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState<{
    name: string;
    evaluationType: 'Cuatrimestral' | 'Recuperatorio';
    weeklyHours: number;
    years: string;
  }>({
    name: '',
    evaluationType: 'Cuatrimestral',
    weeklyHours: 4,
    years: '1° a 5°'
  });

  // Estados para Eliminación
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deletingTarget, setDeletingTarget] = useState<{ id: string; type: 'course' | 'subject' } | null>(null);

  // Cambiar pestaña
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // --- LÓGICA DE CURSOS ---
  const handleOpenCourseCreate = () => {
    setEditingCourse(null);
    setCourseForm({ year: '1° Año', section: 'A', shift: 'Mañana', enrolled: 0, capacity: 30, preceptor: '' });
    setOpenCourseModal(true);
  };

  const handleOpenCourseEdit = (course: CourseSection) => {
    setEditingCourse(course);
    setCourseForm({
      year: course.year,
      section: course.section,
      shift: course.shift,
      enrolled: course.enrolled,
      capacity: course.capacity,
      preceptor: course.preceptor
    });
    setOpenCourseModal(true);
  };

  const handleSaveCourse = () => {
    if (editingCourse) {
      setCourses(prev => prev.map(item => (item.id === editingCourse.id ? { ...item, ...courseForm } : item)));
    } else {
      setCourses(prev => [...prev, { id: Date.now().toString(), ...courseForm }]);
    }
    setOpenCourseModal(false);
  };

  // --- LÓGICA DE MATERIAS ---
  const handleOpenSubjectCreate = () => {
    setEditingSubject(null);
    setSubjectForm({ name: '', evaluationType: 'Cuatrimestral', weeklyHours: 4, years: '1° a 5°' });
    setOpenSubjectModal(true);
  };

  const handleOpenSubjectEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectForm({
      name: subject.name,
      evaluationType: subject.evaluationType,
      weeklyHours: subject.weeklyHours,
      years: subject.years
    });
    setOpenSubjectModal(true);
  };

  const handleSaveSubject = () => {
    if (editingSubject) {
      setSubjects(prev => prev.map(item => (item.id === editingSubject.id ? { ...item, ...subjectForm } : item)));
    } else {
      setSubjects(prev => [...prev, { id: Date.now().toString(), ...subjectForm }]);
    }
    setOpenSubjectModal(false);
  };

  // --- ELIMINACIÓN GENÉRICA ---
  const handleOpenDelete = (id: string, type: 'course' | 'subject') => {
    setDeletingTarget({ id, type });
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (deletingTarget) {
      if (deletingTarget.type === 'course') {
        setCourses(prev => prev.filter(item => item.id !== deletingTarget.id));
        setCoursePage(0);
      } else {
        setSubjects(prev => prev.filter(item => item.id !== deletingTarget.id));
        setSubjectPage(0);
      }
    }
    setOpenDeleteModal(false);
    setDeletingTarget(null);
  };

  const handleCoursePageChange = (_: unknown, newPage: number) => {
    setCoursePage(newPage);
  };

  const handleCourseRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCourseRowsPerPage(parseInt(event.target.value, 10));
    setCoursePage(0);
  };

  const handleSubjectPageChange = (_: unknown, newPage: number) => {
    setSubjectPage(newPage);
  };

  const handleSubjectRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSubjectRowsPerPage(parseInt(event.target.value, 10));
    setSubjectPage(0);
  };

  const paginatedCourses = courses.slice(coursePage * courseRowsPerPage, coursePage * courseRowsPerPage + courseRowsPerPage);
  const paginatedSubjects = subjects.slice(subjectPage * subjectRowsPerPage, subjectPage * subjectRowsPerPage + subjectRowsPerPage);

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 1 }}>
        {/* Breadcrumb discreto superior similar al de la imagen */}
        <Typography variant="caption" sx={{ color: '#9ca3af', mb: 1, display: 'block' }}>
          Inicio &gt; Configuración &gt; <strong>Estructura institucional</strong>
        </Typography>

        {/* Encabezado */}
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#111827', mb: 0.5 }}>
          Estructura institucional
        </Typography>
        <Typography variant="body1" sx={{ color: '#6b7280', mb: 3 }}>
          Definí los cursos, secciones y materias de la institución
        </Typography>

        {/* Tarjeta Contenedora Principal */}
        <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: '#e5e7eb', overflow: 'hidden' }}>
          {/* Navegación por Solapas / Tabs */}
          <CustomTabs
            tabs={['Cursos y secciones', 'Materias', 'Asignación docente']}
            value={currentTab}
            onChange={handleTabChange}
          />

          {/* SOLAPA 0: CURSOS Y SECCIONES */}
          {currentTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, borderBottom: '1px solid #f3f4f6' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCourseCreate}
                  sx={{
                    backgroundColor: '#111827',
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 1.5,
                    px: 2,
                    '&:hover': { backgroundColor: '#1f2937' }
                  }}
                >
                  Nuevo curso
                </Button>
              </Box>

              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ backgroundColor: '#fafafa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.75rem', letterSpacing: '0.05em' }}>AÑO</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.75rem', letterSpacing: '0.05em' }}>SECCIÓN</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.75rem', letterSpacing: '0.05em' }}>TURNO</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.75rem', letterSpacing: '0.05em' }}>ALUMNOS INSCRIPTOS</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.75rem', letterSpacing: '0.05em' }}>CAPACIDAD</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.75rem', letterSpacing: '0.05em' }}>PRECEPTOR ASIGNADO</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.75rem', letterSpacing: '0.05em' }}>ACCIONES</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedCourses.map((row) => (
                      <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 600, color: '#111827' }}>{row.year}</TableCell>
                        <TableCell sx={{ color: '#374151' }}>{row.section}</TableCell>
                        <TableCell sx={{ color: '#374151' }}>{row.shift}</TableCell>
                        <TableCell sx={{ color: '#374151' }}>{row.enrolled}</TableCell>
                        <TableCell sx={{ color: '#374151' }}>{row.capacity}</TableCell>
                        <TableCell>
                          {row.preceptor ? (
                            <Typography variant="body2" sx={{ color: '#374151' }}>
                              {row.preceptor}
                            </Typography>
                          ) : (
                            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                              — Sin asignar
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <IconButton size="small" onClick={() => handleOpenCourseEdit(row)} sx={{ color: '#374151' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleOpenDelete(row.id, 'course')} sx={{ color: '#dc2626' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={courses.length}
                rowsPerPage={courseRowsPerPage}
                page={coursePage}
                onPageChange={handleCoursePageChange}
                onRowsPerPageChange={handleCourseRowsPerPageChange}
                labelDisplayedRows={({ from, to, count: total }) =>
                  `${from}–${to} de ${total === -1 ? total : total}`
                }
              />
            </Box>
          )}

          {/* SOLAPA 1: MATERIAS */}
          {currentTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, borderBottom: '1px solid #f3f4f6' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenSubjectCreate}
                  sx={{
                    backgroundColor: '#111827',
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 1.5,
                    px: 2,
                    '&:hover': { backgroundColor: '#1f2937' }
                  }}
                >
                  Nueva materia
                </Button>
              </Box>

              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ backgroundColor: '#fafafa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.75rem', letterSpacing: '0.05em' }}>MATERIA</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.75rem', letterSpacing: '0.05em' }}>TIPO DE EVALUACIÓN</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.75rem', letterSpacing: '0.05em' }}>HORAS SEMANALES</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.75rem', letterSpacing: '0.05em' }}>AÑOS QUE CURSA</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.75rem', letterSpacing: '0.05em' }}>ACCIONES</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedSubjects.map((row) => (
                      <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
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
                              fontSize: '0.8rem'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#374151' }}>{row.weeklyHours} hs</TableCell>
                        <TableCell sx={{ color: '#374151' }}>{row.years}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <IconButton size="small" onClick={() => handleOpenSubjectEdit(row)} sx={{ color: '#374151' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleOpenDelete(row.id, 'subject')} sx={{ color: '#dc2626' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={subjects.length}
                rowsPerPage={subjectRowsPerPage}
                page={subjectPage}
                onPageChange={handleSubjectPageChange}
                onRowsPerPageChange={handleSubjectRowsPerPageChange}
                labelDisplayedRows={({ from, to, count: total }) =>
                  `${from}–${to} de ${total === -1 ? total : total}`
                }
              />
            </Box>
          )}

          {/* SOLAPA 2: ASIGNACIÓN DOCENTE */}
          {currentTab === 2 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Módulo de Asignación Docente
              </Typography>
            </Box>
          )}
        </Paper>

        {/* MODAL CURSOS (Crear/Editar) */}
        <Dialog open={openCourseModal} onClose={() => setOpenCourseModal(false)} maxWidth="xs" fullWidth>
          <DialogTitle>{editingCourse ? 'Editar Curso / Sección' : 'Nuevo Curso / Sección'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Año"
                select
                fullWidth
                value={courseForm.year}
                onChange={e => setCourseForm({ ...courseForm, year: e.target.value })}
              >
                {['1° Año', '2° Año', '3° Año', '4° Año', '5° Año', '6° Año'].map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Sección"
                fullWidth
                value={courseForm.section}
                onChange={e => setCourseForm({ ...courseForm, section: e.target.value })}
                placeholder="Ej. A, B, C"
              />
              <TextField
                label="Turno"
                select
                fullWidth
                value={courseForm.shift}
                onChange={e => setCourseForm({ ...courseForm, shift: e.target.value })}
              >
                {['Mañana', 'Tarde', 'Noche'].map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Capacidad"
                type="number"
                fullWidth
                value={courseForm.capacity}
                onChange={e => setCourseForm({ ...courseForm, capacity: Number(e.target.value) })}
              />
              <TextField
                label="Preceptor Asignado"
                fullWidth
                value={courseForm.preceptor}
                onChange={e => setCourseForm({ ...courseForm, preceptor: e.target.value })}
                placeholder="Dejar vacío si no está asignado"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenCourseModal(false)} color="inherit">Cancelar</Button>
            <Button onClick={handleSaveCourse} variant="contained" sx={{ backgroundColor: '#111827' }}>Guardar</Button>
          </DialogActions>
        </Dialog>

        {/* MODAL MATERIAS (Crear/Editar) */}
        <Dialog open={openSubjectModal} onClose={() => setOpenSubjectModal(false)} maxWidth="xs" fullWidth>
          <DialogTitle>{editingSubject ? 'Editar Materia' : 'Nueva Materia'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Nombre de la materia"
                fullWidth
                value={subjectForm.name}
                onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                placeholder="Ej. Matemática, Lengua..."
              />
              <TextField
                label="Tipo de Evaluación"
                select
                fullWidth
                value={subjectForm.evaluationType}
                onChange={e => setSubjectForm({ ...subjectForm, evaluationType: e.target.value as 'Cuatrimestral' | 'Recuperatorio' })}
              >
                <MenuItem value="Cuatrimestral">Cuatrimestral</MenuItem>
                <MenuItem value="Recuperatorio">Recuperatorio</MenuItem>
              </TextField>
              <TextField
                label="Horas Semanales"
                type="number"
                fullWidth
                value={subjectForm.weeklyHours}
                onChange={e => setSubjectForm({ ...subjectForm, weeklyHours: Number(e.target.value) })}
              />
              <TextField
                label="Años que cursa"
                fullWidth
                value={subjectForm.years}
                onChange={e => setSubjectForm({ ...subjectForm, years: e.target.value })}
                placeholder="Ej. 1° a 5°, 1° a 3°"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenSubjectModal(false)} color="inherit">Cancelar</Button>
            <Button onClick={handleSaveSubject} variant="contained" sx={{ backgroundColor: '#111827' }}>Guardar</Button>
          </DialogActions>
        </Dialog>

        {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
        <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
          <DialogTitle>
            {deletingTarget?.type === 'course' ? '¿Eliminar curso?' : '¿Eliminar materia?'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Esta acción dará de baja el registro seleccionado del sistema. ¿Deseas continuar?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDeleteModal(false)} color="inherit">Cancelar</Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error">Eliminar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default CoursesPage;