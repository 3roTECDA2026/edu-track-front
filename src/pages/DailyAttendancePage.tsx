import React, { useMemo, useState } from 'react';
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
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/common/PageHeader';

const COURSES = [
  { id: 'c1', name: '3° Año' },
  { id: 'c2', name: '4° Año' },
  { id: 'c3', name: '5° Año' },
];

const SECTIONS = ['A', 'B', 'C'];

const STUDENTS = [
  { id: 's1', courseId: 'c1', sectionId: 'A', dni: '45.878.901', lastName: 'Pérez', firstName: 'Sofía Lucía' },
  { id: 's2', courseId: 'c1', sectionId: 'A', dni: '46.123.456', lastName: 'García', firstName: 'Mateo Nicolás' },
  { id: 's3', courseId: 'c1', sectionId: 'A', dni: '44.987.654', lastName: 'Rodríguez', firstName: 'Valentina' },
  { id: 's4', courseId: 'c1', sectionId: 'A', dni: '47.111.222', lastName: 'Martínez', firstName: 'Facundo' },
  { id: 's5', courseId: 'c1', sectionId: 'A', dni: '46.555.888', lastName: 'Luna', firstName: 'Camila' },
  { id: 's6', courseId: 'c1', sectionId: 'A', dni: '45.333.777', lastName: 'Díaz', firstName: 'Tomás Agustín' },
  { id: 's7', courseId: 'c1', sectionId: 'A', dni: '48.999.000', lastName: 'Romero', firstName: 'Agustina' },
];

type AttendanceState = 'present' | 'absent' | 'late' | 'justified' | 'empty';

const PAGE_SIZE = 10;

const ATTENDANCE_OPTIONS: { value: AttendanceState; label: string }[] = [
  { value: 'present', label: 'P' },
  { value: 'absent', label: 'A' },
  { value: 'late', label: 'R' },
  { value: 'justified', label: 'J' },
];

const ATTENDANCE_LABELS: Record<AttendanceState, string> = {
  present: 'Presente',
  absent: 'Ausente (Falta)',
  late: 'Retardo / Llegada tarde (> 20 min)',
  justified: 'Inasistencia justificada',
  empty: 'Sin registrar',
};

const getButtonStyle = (selected: boolean, value: AttendanceState) => {
  if (!selected) {
    return {
      backgroundColor: 'transparent',
      color: '#4b5563',
      borderColor: '#d1d5db',
      '&:hover': { backgroundColor: '#f3f4f6', borderColor: '#9ca3af' },
    };
  }
  switch (value) {
    case 'present':
      return { backgroundColor: '#111827', color: '#ffffff', borderColor: '#111827', '&:hover': { backgroundColor: '#1f2937' } };
    case 'absent':
      return { backgroundColor: '#dc2626', color: '#ffffff', borderColor: '#dc2626', '&:hover': { backgroundColor: '#b91c1c' } };
    case 'late':
      return { backgroundColor: '#d97706', color: '#ffffff', borderColor: '#d97706', '&:hover': { backgroundColor: '#b45309' } };
    case 'justified':
      return { backgroundColor: '#2563eb', color: '#ffffff', borderColor: '#2563eb', '&:hover': { backgroundColor: '#1d4ed8' } };
    default:
      return { backgroundColor: '#e5e7eb', color: '#111827', borderColor: '#d1d5db' };
  }
};

export const DailyAttendancePage: React.FC = () => {
  const [courseId, setCourseId] = useState<string>('c1');
  const [sectionId, setSectionId] = useState<string>('A');
  const [date, setDate] = useState<string>('2026-11-25');
  const [page, setPage] = useState<number>(1);

  const [attendance, setAttendance] = useState<Record<string, AttendanceState>>({});
  const [notice, setNotice] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const courseStudents = useMemo(() => {
    return STUDENTS.filter((s) => s.courseId === courseId && s.sectionId === sectionId)
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'es'));
  }, [courseId, sectionId]);

  const pageStudents = courseStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleAttendanceChange(studentId: string, state: AttendanceState) {
    const key = `${studentId}-${date}`;
    setAttendance((prev) => ({
      ...prev,
      [key]: state,
    }));
    setNotice(null);
  }

  function markAllPresent() {
    setAttendance((prev) => {
      const copy = { ...prev };
      courseStudents.forEach((s) => {
        copy[`${s.id}-${date}`] = 'present';
      });
      return copy;
    });
    setNotice({ type: 'info', text: 'Se marcó a todos los alumnos como presentes para la fecha seleccionada.' });
  }

  function saveAttendance() {
    setNotice({ type: 'success', text: '¡Asistencia guardada con éxito en el sistema!' });
  }

  const currentCourse = COURSES.find((c) => c.id === courseId);

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

        <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#fafafa', borderColor: '#e1e5e8' }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#374151' }}>
            Seleccionar curso y fecha
          </Typography>
          <Stack sx={{ alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
              <InputLabel id="lbl-course">Curso</InputLabel>
              <Select
                labelId="lbl-course"
                label="Curso"
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setPage(1);
                  setNotice(null);
                }}
              >
                {COURSES.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
              <InputLabel id="lbl-section">Sección</InputLabel>
              <Select
                labelId="lbl-section"
                label="Sección"
                value={sectionId}
                onChange={(e) => {
                  setSectionId(e.target.value);
                  setPage(1);
                  setNotice(null);
                }}
              >
                {SECTIONS.map((sec) => (
                  <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setNotice(null);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #c4c4c4',
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '0.875rem',
                  color: '#333',
                  backgroundColor: '#fff',
                  outline: 'none',
                }}
              />
            </FormControl>

            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => setNotice({ type: 'info', text: `Mostrando datos para ${currentCourse?.name} Sección ${sectionId}` })}
              sx={{
                backgroundColor: '#111827',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                '&:hover': { backgroundColor: '#1f2937' },
              }}
            >
              Buscar
            </Button>
          </Stack>
        </Paper>

        {notice && (
          <Alert severity={notice.type} onClose={() => setNotice(null)} sx={{ mb: 2 }}>
            {notice.text}
          </Alert>
        )}

        <Box
          sx={{ 
            display: 'flex',
            mb: 1.5, 
            p: 1.5, 
            backgroundColor: '#fafafa', 
            border: '1px solid #e1e5e8', 
            borderRadius: 1,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: '#202124', fontWeight: 700 }}>
            {currentCourse?.name} — Sección {sectionId} — Fecha: {date}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
            {courseStudents.length} alumnos
          </Typography>
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ borderColor: '#e1e5e8' }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>DNI</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Apellido y Nombre</TableCell>
                <TableCell align="center" width={280} sx={{ fontWeight: 700, color: '#374151' }}>
                  Opciones de Asistencia (P / A / R / J)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageStudents.map((student) => {
                const currentState = attendance[`${student.id}-${date}`] || 'empty';
                return (
                  <TableRow key={student.id} hover>
                    <TableCell sx={{ color: '#6b7280', fontWeight: 500 }}>{student.dni}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#111827' }}>
                      {student.lastName}, {student.firstName}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                        {ATTENDANCE_OPTIONS.map((opt) => {
                          const selected = currentState === opt.value;
                          return (
                            <Tooltip key={opt.value} title={ATTENDANCE_LABELS[opt.value]} arrow>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleAttendanceChange(student.id, opt.value)}
                                sx={{
                                  minWidth: 38,
                                  height: 32,
                                  padding: 0,
                                  fontWeight: 700,
                                  borderRadius: 1,
                                  boxShadow: 'none',
                                  ...getButtonStyle(selected, opt.value),
                                }}
                              >
                                {opt.label}
                              </Button>
                            </Tooltip>
                          );
                        })}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mt: 2,
            gap: 2 
          }}
        >
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Mostrando {courseStudents.length} de {courseStudents.length} alumnos
          </Typography>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<CheckIcon />}
              onClick={markAllPresent}
              sx={{ textTransform: 'none', borderColor: '#d1d5db', color: '#374151', fontWeight: 600 }}
            >
              Marcar todos presentes
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveAttendance}
              sx={{ textTransform: 'none', backgroundColor: '#111827', fontWeight: 600, '&:hover': { backgroundColor: '#1f2937' } }}
            >
              Guardar asistencia
            </Button>
          </Stack>
        </Box>
      </Box>
    </MainLayout>
  );
};

export default DailyAttendancePage;