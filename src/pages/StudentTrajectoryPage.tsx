import { useEffect, useState } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { useNavigate, useParams } from 'react-router-dom';

import MainLayout from '@/components/layout/MainLayout';

import {
  getStudent,
  getStudentTrajectory,
  type StudentDetail,
  type StudentTrajectoryRecord,
} from '@/services/students.service';

const formatDate = (date: string | null) => {
  if (!date) {
    return 'Actualidad';
  }

  return new Date(date).toLocaleDateString('es-AR');
};

const formatShift = (shift: StudentTrajectoryRecord['shift']) => {
  switch (shift) {
    case 'MORNING':
      return 'Mañana';

    case 'AFTERNOON':
      return 'Tarde';

    case 'EVENING':
      return 'Noche';

    case 'EXTRA_TIME':
      return 'Extra';

    default:
      return shift;
  }
};

const StudentTrajectoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<StudentDetail | null>(null);

  const [trajectory, setTrajectory] = useState<
    StudentTrajectoryRecord[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No se indicó el estudiante.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    setLoading(true);
    setError(null);

    void Promise.all([
      getStudent(id, controller.signal),
      getStudentTrajectory(id, controller.signal),
    ])
      .then(([studentData, trajectoryData]) => {
        if (controller.signal.aborted) {
          return;
        }

        setStudent(studentData);
        setTrajectory(trajectoryData);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo cargar la trayectoria del estudiante.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [id]);

  return (
    <MainLayout>
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
        }}
      >
        <Stack spacing={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/students')}
            sx={{
              alignSelf: 'flex-start',
              color: '#202124',
            }}
          >
            Volver a estudiantes
          </Button>

          {loading && (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
              }}
            >
              <CircularProgress size={20} />

              <Typography>
                Cargando trayectoria...
              </Typography>
            </Stack>
          )}

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {!loading && !error && student && (
            <>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    color: '#202124',
                    fontWeight: 800,
                  }}
                >
                  {student.lastName}, {student.firstName}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: '#687078',
                    mt: 0.5,
                  }}
                >
                  Legajo {student.recordNumber} · DNI {student.dni}
                </Typography>

                {student.currentSection && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#687078',
                      mt: 1,
                    }}
                  >
                    Curso actual:{' '}
                    {student.currentSection.grade}°{' '}
                    {student.currentSection.division}
                    {' · '}
                    Turno {formatShift(student.currentSection.shift)}
                  </Typography>
                )}
              </Paper>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: '#202124',
                }}
              >
                Trayectoria escolar
              </Typography>

              {trajectory.length === 0 ? (
                <Alert severity="info">
                  Todavía no hay registros de trayectoria para este
                  estudiante.
                </Alert>
              ) : (
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 800 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <strong>Ciclo lectivo</strong>
                          </TableCell>

                          <TableCell>
                            <strong>Curso</strong>
                          </TableCell>

                          <TableCell>
                            <strong>Turno</strong>
                          </TableCell>

                          <TableCell>
                            <strong>Desde</strong>
                          </TableCell>

                          <TableCell>
                            <strong>Hasta</strong>
                          </TableCell>

                          <TableCell>
                            <strong>Estado</strong>
                          </TableCell>

                          <TableCell>
                            <strong>Motivo de salida</strong>
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {trajectory.map((record) => (
                          <TableRow
                            key={record.id}
                            hover
                          >
                            <TableCell>
                              {record.year}
                            </TableCell>

                            <TableCell>
                              {record.section}
                            </TableCell>

                            <TableCell>
                              {formatShift(record.shift)}
                            </TableCell>

                            <TableCell>
                              {formatDate(record.startDate)}
                            </TableCell>

                            <TableCell>
                              {formatDate(record.endDate)}
                            </TableCell>

                            <TableCell>
                              {record.endDate ? (
                                <Chip
                                  label="Finalizado"
                                  size="small"
                                  variant="outlined"
                                />
                              ) : (
                                <Chip
                                  label="Actual"
                                  size="small"
                                  color="success"
                                />
                              )}
                            </TableCell>

                            <TableCell>
                              {record.leaveReason || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Paper>
              )}
            </>
          )}
        </Stack>
      </Box>
    </MainLayout>
  );
};

export default StudentTrajectoryPage;