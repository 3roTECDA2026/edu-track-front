import { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import {
  getStudent,
  getStudentTrajectory,
  type StudentDetail,
  type StudentTrajectoryYear,
} from "@/services/students.service";

export const StudentTrajectoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [trajectory, setTrajectory] = useState<StudentTrajectoryYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No se indicó el estudiante.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    void Promise.all([
      getStudent(id, controller.signal),
      getStudentTrajectory(id, controller.signal),
    ])
      .then(([studentData, trajectoryData]) => {
        if (controller.signal.aborted) return;
        setStudent(studentData);
        setTrajectory(trajectoryData);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar la trayectoria del estudiante.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Stack spacing={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/students")}
            sx={{ alignSelf: "flex-start", color: "#202124" }}
          >
            Volver a estudiantes
          </Button>

          {loading && (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <CircularProgress size={20} />
              <Typography>Cargando trayectoria...</Typography>
            </Stack>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {student && (
            <>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ color: "#202124", fontWeight: 800 }}
                >
                  {student.lastName}, {student.firstName}
                </Typography>
                <Typography variant="body2" sx={{ color: "#687078", mt: 0.5 }}>
                  Legajo {student.recordNumber} · DNI {student.dni}
                </Typography>
              </Box>

              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: "#202124" }}
              >
                Trayectoria escolar
              </Typography>

              {!loading && trajectory.length === 0 && (
                <Alert severity="info">
                  Todavía no hay registros anuales para este estudiante.
                </Alert>
              )}

              {trajectory.map((year) => (
                <Paper
                  key={year.year}
                  variant="outlined"
                  sx={{
                    borderRadius: 1,
                    borderColor: "#dfe3e7",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderBottom: "1px solid #e8eaed",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 800, color: "#202124" }}
                    >
                      Ciclo lectivo {year.year}
                    </Typography>
                  </Box>

                  <Stack spacing={2.5} sx={{ p: 2 }}>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, fontWeight: 700 }}
                      >
                        Cursos y docentes
                      </Typography>
                      {year.sections.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Sin historial de sección para este ciclo.
                        </Typography>
                      ) : (
                        <Stack spacing={1}>
                          {year.sections.map((section) => (
                            <Box key={section.id}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {section.section} · Turno {section.shift}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {section.teachers.length > 0
                                  ? section.teachers
                                      .map(
                                        (teacher) =>
                                          `${teacher.firstName} ${teacher.lastName} · ${teacher.subject}`,
                                      )
                                      .join(" | ")
                                  : "Sin docentes asignados registrados"}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Box>

                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, fontWeight: 700 }}
                      >
                        Materias y calificaciones
                      </Typography>
                      {year.subjects.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Sin materias o calificaciones registradas para este
                          ciclo.
                        </Typography>
                      ) : (
                        <Box sx={{ overflowX: "auto" }}>
                          <Table size="small" sx={{ minWidth: 620 }}>
                            <TableHead>
                              <TableRow>
                                <TableCell>Materia</TableCell>
                                <TableCell>Curso</TableCell>
                                <TableCell>Docente</TableCell>
                                <TableCell align="center">1° cuatri</TableCell>
                                <TableCell align="center">2° cuatri</TableCell>
                                <TableCell align="center">Final</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {year.subjects.map((subject) => (
                                <TableRow key={subject.id}>
                                  <TableCell>{subject.name}</TableCell>
                                  <TableCell>{subject.section}</TableCell>
                                  <TableCell>
                                    {subject.teachers.join(", ") || "—"}
                                  </TableCell>
                                  <TableCell align="center">
                                    {subject.grades?.term1Score ?? "—"}
                                  </TableCell>
                                  <TableCell align="center">
                                    {subject.grades?.term2Score ?? "—"}
                                  </TableCell>
                                  <TableCell align="center">
                                    {subject.grades?.finalScore ?? "—"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      )}
                    </Box>

                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 0.5, fontWeight: 700 }}
                      >
                        Asistencia
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {year.attendance.total} registros ·{" "}
                        {year.attendance.absences} inasistencias ·{" "}
                        {year.attendance.justifiedAbsences} justificadas
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 0.5, fontWeight: 700 }}
                      >
                        Alertas
                      </Typography>
                      {year.alerts.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Sin alertas registradas para este ciclo.
                        </Typography>
                      ) : (
                        <Stack spacing={1}>
                          {year.alerts.map((alert) => (
                            <Box key={alert.id}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {new Date(alert.createdAt).toLocaleDateString(
                                  "es-AR",
                                )}{" "}
                                · {alert.type} · {alert.severity}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {alert.message}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </>
          )}
        </Stack>
      </Box>
    </MainLayout>
  );
};

export default StudentTrajectoryPage;
