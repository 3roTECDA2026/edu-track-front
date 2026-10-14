
import React, { useEffect, useState } from 'react';
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
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import MainLayout from '@/components/layout/MainLayout';
import CustomTabs from '@/components/common/CustomTabs';
import AddButton from '@/components/common/AddButton';
import { listCourses } from '@/services/courses.service';

// ============================================
// INTERFACES
// ============================================

interface CourseSection {
  id: string;
  year: string;
  section: string;
  shift: string;
  enrolled: number | null;
  capacity: number | null;
  preceptor: string | null;
}

interface Subject {
  id: string;
  name: string;
  evaluationType: 'Cuatrimestral' | 'Recuperatorio';
  weeklyHours: number;
  years: string;
}

// ============================================
// MATERIAS SIMULADAS
// Pendientes de conectar al backend
// ============================================

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
  {
    id: '6',
    name: 'Inglés',
    evaluationType: 'Cuatrimestral',
    weeklyHours: 3,
    years: '1° a 5°',
  },
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
];

const initialSubjectForm: Omit<Subject, 'id'> = {
  name: '',
  evaluationType: 'Cuatrimestral',
  weeklyHours: 4,
  years: '1° a 5°',
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const CoursesPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  // ==========================================
  // ESTADOS DE CURSOS
  // ==========================================

  const [courses, setCourses] = useState<CourseSection[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState('');

  const [coursePage, setCoursePage] = useState(0);
  const [courseRowsPerPage, setCourseRowsPerPage] = useState(10);

  // ==========================================
  // ESTADOS DE MATERIAS
  // ==========================================

  const [subjects, setSubjects] =
    useState<Subject[]>(initialSubjects);

  const [subjectPage, setSubjectPage] = useState(0);
  const [subjectRowsPerPage, setSubjectRowsPerPage] = useState(10);

  const [openSubjectModal, setOpenSubjectModal] = useState(false);

  const [editingSubject, setEditingSubject] =
    useState<Subject | null>(null);

  const [subjectForm, setSubjectForm] =
    useState<Omit<Subject, 'id'>>(initialSubjectForm);

  // ==========================================
  // ESTADOS DE ELIMINACIÓN
  // ==========================================

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deletingTarget, setDeletingTarget] =
    useState<string | null>(null);

  // ==========================================
  // CARGAR CURSOS DESDE NEON
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    async function cargarCursos() {
      try {
        setCoursesLoading(true);
        setCoursesError('');

        const data = await listCourses(controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        const cursosReales: CourseSection[] = data.map(
          (course) => ({
            id: course.id,
            year: `${course.grade}° Año`,
            section: course.division,

            shift:
              course.shift === 'MORNING'
                ? 'Mañana'
                : course.shift === 'AFTERNOON'
                  ? 'Tarde'
                  : course.shift === 'NIGHT'
                    ? 'Noche'
                    : course.shift,

            // Estos datos todavía no llegan del backend.
            enrolled: null,
            capacity: null,
            preceptor: null,
          })
        );

        setCourses(cursosReales);
        setCoursePage(0);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error('Error al cargar cursos:', error);

        setCoursesError(
          'No se pudieron cargar los cursos desde el servidor.'
        );

        setCourses([]);
      } finally {
        if (!controller.signal.aborted) {
          setCoursesLoading(false);
        }
      }
    }

    void cargarCursos();

    return () => {
      controller.abort();
    };
  }, []);

  // ==========================================
  // FUNCIONES DE MATERIAS
  // ==========================================

  const handleOpenSubjectCreate = () => {
    setEditingSubject(null);
    setSubjectForm({ ...initialSubjectForm });
    setOpenSubjectModal(true);
  };

  const handleOpenSubjectEdit = (subject: Subject) => {
    setEditingSubject(subject);

    setSubjectForm({
      name: subject.name,
      evaluationType: subject.evaluationType,
      weeklyHours: subject.weeklyHours,
      years: subject.years,
    });

    setOpenSubjectModal(true);
  };

  const handleSaveSubject = () => {
    if (!subjectForm.name.trim()) {
      return;
    }

    if (editingSubject) {
      setSubjects((prev) =>
        prev.map((item) =>
          item.id === editingSubject.id
            ? { ...item, ...subjectForm }
            : item
        )
      );
    } else {
      setSubjects((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          ...subjectForm,
        },
      ]);
    }

    setOpenSubjectModal(false);
  };

  const handleOpenDeleteSubject = (id: string) => {
    setDeletingTarget(id);
    setOpenDeleteModal(true);
  };

  const handleConfirmDeleteSubject = () => {
    if (deletingTarget) {
      setSubjects((prev) =>
        prev.filter((item) => item.id !== deletingTarget)
      );

      setSubjectPage(0);
    }

    setOpenDeleteModal(false);
    setDeletingTarget(null);
  };

  // ==========================================
  // PAGINACIÓN
  // ==========================================

  const paginatedCourses = courses.slice(
    coursePage * courseRowsPerPage,
    coursePage * courseRowsPerPage + courseRowsPerPage
  );

  const paginatedSubjects = subjects.slice(
    subjectPage * subjectRowsPerPage,
    subjectPage * subjectRowsPerPage + subjectRowsPerPage
  );

  const headerStyle = {
    fontWeight: 700,
    color: '#4b5563',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
  };

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 1 }}>

        {/* BREADCRUMB */}

        <Typography
          variant="caption"
          sx={{
            color: '#9ca3af',
            mb: 1,
            display: 'block',
          }}
        >
          Inicio &gt; Configuración &gt;{' '}
          <strong>Estructura institucional</strong>
        </Typography>

        {/* ENCABEZADO */}

        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            color: '#111827',
            mb: 0.5,
          }}
        >
          Estructura institucional
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: '#6b7280',
            mb: 3,
          }}
        >
          Definí los cursos, secciones y materias de la institución
        </Typography>

        {/* CONTENEDOR PRINCIPAL */}

        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            borderColor: '#e5e7eb',
            overflow: 'hidden',
          }}
        >
          <CustomTabs
            tabs={[
              'Cursos y secciones',
              'Materias',
              'Asignación docente',
            ]}
            value={currentTab}
            onChange={(_, newValue) => {
              setCurrentTab(newValue);
            }}
          />

          {/* ===================================
              SOLAPA 0: CURSOS Y SECCIONES
          =================================== */}

          {currentTab === 0 && (
            <Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  p: 2,
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                {/* Crear cursos se habilitará al
                    conectar POST con Neon. */}

                <Box
                  sx={{
                    opacity: 0.5,
                    pointerEvents: 'none',
                  }}
                >
                  <AddButton
                    label="Nuevo curso"
                    onClick={() => {}}
                  />
                </Box>
              </Box>

              {/* CARGANDO */}

              {coursesLoading && (
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    p: 3,
                    alignItems: 'center',
                  }}
                >
                  <CircularProgress size={22} />

                  <Typography>
                    Cargando cursos...
                  </Typography>
                </Stack>
              )}

              {/* ERROR */}

              {coursesError && (
                <Alert severity="error" sx={{ m: 2 }}>
                  {coursesError}
                </Alert>
              )}

              {/* SIN CURSOS */}

              {!coursesLoading &&
                !coursesError &&
                courses.length === 0 && (
                  <Alert severity="info" sx={{ m: 2 }}>
                    No hay cursos registrados en la base de datos.
                  </Alert>
                )}

              {/* TABLA DE CURSOS */}

              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead
                    sx={{
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <TableRow>
                      <TableCell sx={headerStyle}>
                        AÑO
                      </TableCell>

                      <TableCell sx={headerStyle}>
                        SECCIÓN
                      </TableCell>

                      <TableCell sx={headerStyle}>
                        TURNO
                      </TableCell>

                      <TableCell sx={headerStyle}>
                        ALUMNOS INSCRIPTOS
                      </TableCell>

                      <TableCell sx={headerStyle}>
                        CAPACIDAD
                      </TableCell>

                      <TableCell sx={headerStyle}>
                        PRECEPTOR ASIGNADO
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={headerStyle}
                      >
                        ACCIONES
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paginatedCourses.map((row) => (
                      <TableRow
                        key={row.id}
                        hover
                        sx={{
                          '&:last-child td, &:last-child th': {
                            border: 0,
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            color: '#111827',
                          }}
                        >
                          {row.year}
                        </TableCell>

                        <TableCell>
                          {row.section}
                        </TableCell>

                        <TableCell>
                          {row.shift}
                        </TableCell>

                        <TableCell>
                          {row.enrolled ?? '—'}
                        </TableCell>

                        <TableCell>
                          {row.capacity ?? '—'}
                        </TableCell>

                        <TableCell>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {row.preceptor ?? '—'}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{
                              justifyContent: 'flex-end',
                            }}
                          >
                            <IconButton
                              size="small"
                              disabled
                              title="Edición pendiente de conectar"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>

                            <IconButton
                              size="small"
                              disabled
                              title="Eliminación pendiente de conectar"
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

              {/* PAGINACIÓN DE CURSOS */}

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={courses.length}
                rowsPerPage={courseRowsPerPage}
                page={coursePage}
                onPageChange={(_, newPage) => {
                  setCoursePage(newPage);
                }}
                onRowsPerPageChange={(event) => {
                  setCourseRowsPerPage(
                    parseInt(event.target.value, 10)
                  );

                  setCoursePage(0);
                }}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} de ${count}`
                }
              />
            </Box>
          )}

          {/* ===================================
              SOLAPA 1: MATERIAS
          =================================== */}

          {currentTab === 1 && (
            <Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  p: 2,
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <AddButton
                  label="Nueva materia"
                  onClick={handleOpenSubjectCreate}
                />
              </Box>

              <Alert severity="info" sx={{ m: 2 }}>
                Las materias todavía se gestionan localmente.
                Sus cambios no se guardan en Neon.
              </Alert>

              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead
                    sx={{
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <TableRow>
                      <TableCell sx={headerStyle}>
                        MATERIA
                      </TableCell>

                      <TableCell sx={headerStyle}>
                        TIPO DE EVALUACIÓN
                      </TableCell>

                      <TableCell sx={headerStyle}>
                        HORAS SEMANALES
                      </TableCell>

                      <TableCell sx={headerStyle}>
                        AÑOS QUE CURSA
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={headerStyle}
                      >
                        ACCIONES
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paginatedSubjects.map((row) => (
                      <TableRow
                        key={row.id}
                        hover
                      >
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            color: '#111827',
                          }}
                        >
                          {row.name}
                        </TableCell>

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
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          {row.weeklyHours} hs
                        </TableCell>

                        <TableCell>
                          {row.years}
                        </TableCell>

                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{
                              justifyContent: 'flex-end',
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => {
                                handleOpenSubjectEdit(row);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>

                            <IconButton
                              size="small"
                              onClick={() => {
                                handleOpenDeleteSubject(row.id);
                              }}
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

              {/* PAGINACIÓN DE MATERIAS */}

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={subjects.length}
                rowsPerPage={subjectRowsPerPage}
                page={subjectPage}
                onPageChange={(_, newPage) => {
                  setSubjectPage(newPage);
                }}
                onRowsPerPageChange={(event) => {
                  setSubjectRowsPerPage(
                    parseInt(event.target.value, 10)
                  );

                  setSubjectPage(0);
                }}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} de ${count}`
                }
              />
            </Box>
          )}

          {/* ===================================
              SOLAPA 2: ASIGNACIÓN DOCENTE
          =================================== */}

          {currentTab === 2 && (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h6"
                color="text.secondary"
              >
                Módulo de Asignación Docente
              </Typography>
            </Box>
          )}
        </Paper>

        {/* ===================================
            MODAL DE MATERIAS
        =================================== */}

        <Dialog
          open={openSubjectModal}
          onClose={() => {
            setOpenSubjectModal(false);
          }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            {editingSubject
              ? 'Editar Materia'
              : 'Nueva Materia'}
          </DialogTitle>

          <DialogContent>
            <Stack
              spacing={2}
              sx={{ mt: 1 }}
            >
              <TextField
                label="Nombre de la materia"
                fullWidth
                value={subjectForm.name}
                onChange={(e) => {
                  setSubjectForm({
                    ...subjectForm,
                    name: e.target.value,
                  });
                }}
                placeholder="Ej. Matemática, Lengua..."
              />

              <TextField
                label="Tipo de Evaluación"
                select
                fullWidth
                value={subjectForm.evaluationType}
                onChange={(e) => {
                  setSubjectForm({
                    ...subjectForm,
                    evaluationType: e.target.value as
                      | 'Cuatrimestral'
                      | 'Recuperatorio',
                  });
                }}
              >
                <MenuItem value="Cuatrimestral">
                  Cuatrimestral
                </MenuItem>

                <MenuItem value="Recuperatorio">
                  Recuperatorio
                </MenuItem>
              </TextField>

              <TextField
                label="Horas Semanales"
                type="number"
                fullWidth
                value={subjectForm.weeklyHours}
                onChange={(e) => {
                  setSubjectForm({
                    ...subjectForm,
                    weeklyHours: Number(e.target.value),
                  });
                }}
              />

              <TextField
                label="Años que cursa"
                fullWidth
                value={subjectForm.years}
                onChange={(e) => {
                  setSubjectForm({
                    ...subjectForm,
                    years: e.target.value,
                  });
                }}
                placeholder="Ej. 1° a 5°"
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                setOpenSubjectModal(false);
              }}
              color="inherit"
            >
              Cancelar
            </Button>

            <Button
              onClick={handleSaveSubject}
              variant="contained"
              sx={{
                backgroundColor: '#111827',
              }}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* ===================================
            MODAL ELIMINAR MATERIA
        =================================== */}

        <Dialog
          open={openDeleteModal}
          onClose={() => {
            setOpenDeleteModal(false);
          }}
        >
          <DialogTitle>
            ¿Eliminar materia?
          </DialogTitle>

          <DialogContent>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              ¿Deseás eliminar la materia seleccionada?
              Este cambio será solamente local.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                setOpenDeleteModal(false);
              }}
              color="inherit"
            >
              Cancelar
            </Button>

            <Button
              onClick={handleConfirmDeleteSubject}
              variant="contained"
              color="error"
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </MainLayout>
  );
};

export default CoursesPage;
