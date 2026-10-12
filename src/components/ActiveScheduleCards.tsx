import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  LinearProgress,
  Chip,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FreeBreakfastIcon from "@mui/icons-material/FreeBreakfast";
import { ContentCard } from "@/components/common/ContentCard";
import {
  useActiveCourses,
  type ActiveCourseData,
  type CourseStatusType,
} from "@/hooks/useActiveCourses";

const SHIFT_LABELS: Record<ActiveCourseData["shift"], string> = {
  MORNING: "Mañana",
  AFTERNOON: "Tarde",
  EVENING: "Vespertino",
  EXTRA_TIME: "Contraturno",
};

// Módulos horarios de la institución
const SCHOOL_MODULES = [
  { name: "1° Módulo", start: "07:30", end: "08:30" },
  { name: "2° Módulo", start: "08:30", end: "09:30" },
  { name: "Recreo Mañana", start: "09:30", end: "09:40", isBreak: true },
  { name: "3° Módulo", start: "09:40", end: "10:40" },
  { name: "4° Módulo", start: "10:40", end: "11:40" },
  { name: "5° Módulo", start: "11:40", end: "12:40" },
  { name: "1° Módulo Tarde", start: "13:00", end: "14:00" },
  { name: "2° Módulo Tarde", start: "14:00", end: "15:00" },
  { name: "Recreo Tarde", start: "15:00", end: "15:10", isBreak: true },
  { name: "3° Módulo Tarde", start: "15:10", end: "16:10" },
  { name: "4° Módulo Tarde", start: "16:10", end: "17:10" },
];

export const ActiveScheduleCards: React.FC = () => {
  const {
    courses,
    loading: coursesLoading,
    error: coursesError,
    updateCourseStatus,
  } = useActiveCourses();
  const [currentModule, setCurrentModule] = useState<
    (typeof SCHOOL_MODULES)[0] | null
  >(null);
  const [now, setNow] = useState<Date>(new Date());

  // Estado para el modal de edición/novedades por curso
  const [editingCourse, setEditingCourse] = useState<ActiveCourseData | null>(
    null,
  );
  const [tempStatus, setTempStatus] = useState<CourseStatusType>("NORMAL");
  const [tempNote, setTempNote] = useState<string>("");

  // 2. Reloj y sincronización de horarios
  useEffect(() => {
    const updateTime = () => {
      const currentDate = new Date();
      setNow(currentDate);

      const currentMins =
        currentDate.getHours() * 60 + currentDate.getMinutes();
      const isWeekend =
        currentDate.getDay() === 0 || currentDate.getDay() === 6;

      if (isWeekend) {
        setCurrentModule(null);
        return;
      }

      const activeMod = SCHOOL_MODULES.find((mod) => {
        const [sh, sm] = mod.start.split(":").map(Number);
        const [eh, em] = mod.end.split(":").map(Number);
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;
        return currentMins >= startMins && currentMins < endMins;
      });

      setCurrentModule(activeMod || null);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000); // Refresca cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  // 3. Cálculo de tiempos transcurridos / faltantes
  const getTimeMetrics = () => {
    if (!currentModule) return { elapsed: 0, remaining: 0, progress: 0 };

    const [sh, sm] = currentModule.start.split(":").map(Number);
    const [eh, em] = currentModule.end.split(":").map(Number);

    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const totalDuration = endMins - startMins;
    const elapsed = Math.max(0, currentMins - startMins);
    const remaining = Math.max(0, endMins - currentMins);
    const progress = Math.min(
      100,
      Math.max(0, (elapsed / totalDuration) * 100),
    );

    return { elapsed, remaining, progress };
  };

  const { elapsed, remaining, progress } = getTimeMetrics();

  // Handlers para guardar novedades
  const handleOpenEdit = (course: ActiveCourseData) => {
    setEditingCourse(course);
    setTempStatus(course.status);
    setTempNote(course.note || "");
  };

  const handleSaveStatus = () => {
    if (!editingCourse) return;

    updateCourseStatus(editingCourse.sectionId, tempStatus, tempNote);
    setEditingCourse(null);
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Encabezado e información del módulo activo */}
      <Stack
        direction="row"
        sx={{
          mb: 2,
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
            Cursos activos en tiempo real
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            {currentModule
              ? `Módulo actual: ${currentModule.name} (${currentModule.start} hs - ${currentModule.end} hs)`
              : "Fuera de horario de clases o recreo escolar"}
          </Typography>
        </Box>
        <Chip
          icon={<AccessTimeIcon fontSize="small" />}
          label={now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          variant="outlined"
          sx={{
            fontWeight: 700,
            backgroundColor: "#111827",
            color: "#ffffff",
            "& .MuiChip-icon": { color: "#ffffff" },
          }}
        />
      </Stack>

      {/* Si es recreo o fuera de horario */}
      {(!currentModule || currentModule.isBreak) && (
        <Alert
          severity="info"
          icon={
            currentModule?.isBreak ? <FreeBreakfastIcon /> : <AccessTimeIcon />
          }
          sx={{
            borderRadius: 2,
            mb: 3,
            backgroundColor: "#f3f4f6",
            color: "#111827",
            "& .MuiAlert-icon": { color: "#111827" },
          }}
        >
          {currentModule?.isBreak
            ? `Recreo en curso (${currentModule.start} - ${currentModule.end}). No hay dictado de clases activo.`
            : "No hay módulos escolares activos en este momento."}
        </Alert>
      )}

      <ContentCard sx={{ p: 0 }}>
        {coursesLoading && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ py: 2, px: 2, alignItems: "center" }}
          >
            <CircularProgress size={20} sx={{ color: "#111827" }} />
            <Typography variant="body2" color="text.secondary">
              Cargando cursos...
            </Typography>
          </Stack>
        )}
        {coursesError && (
          <Alert severity="error" sx={{ mb: 2, mx: 2, mt: 2 }}>
            {coursesError}
          </Alert>
        )}
        {!coursesLoading && !coursesError && courses.length === 0 && (
          <Alert severity="info" sx={{ mb: 2, mx: 2, mt: 2 }}>
            No hay cursos registrados para el ciclo lectivo activo.
          </Alert>
        )}

        <Grid container spacing={2.5} sx={{ p: 2 }}>
          {courses.map((course) => (
            <Grid key={course.sectionId} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2.5,
                  borderColor:
                    course.status === "TEACHER_ABSENT"
                      ? "#d1d5db"
                      : course.status === "INSTITUTIONAL_OUTING"
                        ? "#111827"
                        : "#e5e7eb",
                  backgroundColor:
                    course.status === "TEACHER_ABSENT"
                      ? "#f9fafb"
                      : course.status === "INSTITUTIONAL_OUTING"
                        ? "#111827"
                        : "#ffffff",
                  color:
                    course.status === "INSTITUTIONAL_OUTING"
                      ? "#ffffff"
                      : "#111827",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  {/* Cabecera del Curso */}
                  <Stack
                    direction="row"
                    sx={{
                      mb: 1.5,
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          color:
                            course.status === "INSTITUTIONAL_OUTING"
                              ? "#ffffff"
                              : "#111827",
                        }}
                      >
                        {course.sectionName}
                      </Typography>
                      {course.subjectName && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color:
                              course.status === "INSTITUTIONAL_OUTING"
                                ? "#f3f4f6"
                                : "#374151",
                          }}
                        >
                          {course.subjectName}
                        </Typography>
                      )}
                      {course.teacherName && (
                        <Typography
                          variant="caption"
                          sx={{
                            color:
                              course.status === "INSTITUTIONAL_OUTING"
                                ? "#e5e7eb"
                                : "#6b7280",
                            display: "block",
                          }}
                        >
                          {course.teacherName}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color:
                            course.status === "INSTITUTIONAL_OUTING"
                              ? "#e5e7eb"
                              : "#6b7280",
                          display: "block",
                        }}
                      >
                        Turno {SHIFT_LABELS[course.shift]} · Ciclo{" "}
                        {course.academicYear}
                      </Typography>
                    </Box>

                    <Tooltip title="Registrar novedad / Editar estado">
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleOpenEdit(course)}
                        sx={{
                          minWidth: 36,
                          width: 36,
                          height: 36,
                          p: 0,
                          borderRadius: "50%",
                          backgroundColor:
                            course.status === "INSTITUTIONAL_OUTING"
                              ? "rgba(255,255,255,0.12)"
                              : "#f3f4f6",
                          color:
                            course.status === "INSTITUTIONAL_OUTING"
                              ? "#ffffff"
                              : "#4b5563",
                          "&:hover": {
                            backgroundColor:
                              course.status === "INSTITUTIONAL_OUTING"
                                ? "rgba(255,255,255,0.2)"
                                : "#e5e7eb",
                          },
                        }}
                      >
                        <EditNoteIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  </Stack>

                  {/* Etiquetas de Novedades Específicas */}
                  {course.status === "TEACHER_ABSENT" && (
                    <Chip
                      icon={<PersonOffIcon style={{ fontSize: 16 }} />}
                      label="Ausencia docente"
                      size="small"
                      sx={{
                        fontWeight: 700,
                        mb: 1.5,
                        width: "100%",
                        justifyContent: "flex-start",
                        backgroundColor: "#111827",
                        color: "#ffffff",
                        "& .MuiChip-icon": { color: "#ffffff" },
                      }}
                    />
                  )}

                  {course.status === "INSTITUTIONAL_OUTING" && (
                    <Chip
                      icon={<DirectionsBusIcon style={{ fontSize: 16 }} />}
                      label="Salida institucional"
                      size="small"
                      sx={{
                        fontWeight: 700,
                        mb: 1.5,
                        width: "100%",
                        justifyContent: "flex-start",
                        backgroundColor: "#ffffff",
                        color: "#111827",
                        border: "1px solid rgba(255,255,255,0.35)",
                        "& .MuiChip-icon": { color: "#111827" },
                      }}
                    />
                  )}

                  {Boolean(course.note) && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        fontStyle: "italic",
                        color:
                          course.status === "INSTITUTIONAL_OUTING"
                            ? "#f3f4f6"
                            : "#4b5563",
                        mb: 1.5,
                        p: 1,
                        backgroundColor:
                          course.status === "INSTITUTIONAL_OUTING"
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.03)",
                        borderRadius: 1,
                      }}
                    >
                      "{course.note}"
                    </Typography>
                  )}

                  {/* Barra de progreso y Tiempos en vivo */}
                  {currentModule && !currentModule.isBreak && (
                    <Box sx={{ mt: "auto", pt: 1 }}>
                      <Stack
                        direction="row"
                        sx={{ mb: 0.5, justifyContent: "space-between" }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color:
                              course.status === "INSTITUTIONAL_OUTING"
                                ? "#f3f4f6"
                                : "#4b5563",
                            fontWeight: 600,
                          }}
                        >
                          Transcurrido: {elapsed} min
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color:
                              course.status === "INSTITUTIONAL_OUTING"
                                ? "#ffffff"
                                : "#111827",
                            fontWeight: 700,
                          }}
                        >
                          Faltan: {remaining} min
                        </Typography>
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor:
                            course.status === "INSTITUTIONAL_OUTING"
                              ? "rgba(255,255,255,0.22)"
                              : "#e5e7eb",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor:
                              course.status === "TEACHER_ABSENT"
                                ? "#111827"
                                : course.status === "INSTITUTIONAL_OUTING"
                                  ? "#ffffff"
                                  : "#111827",
                          },
                        }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </ContentCard>

      {/* Modal / Diálogo para Registrar Novedad del Curso */}
      <Dialog
        open={Boolean(editingCourse)}
        onClose={() => setEditingCourse(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Novedad: {editingCourse?.sectionName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#6b7280", mb: 2 }}>
            Ajustá el estado de la clase en vivo para reflejar cambios de último
            momento.
          </Typography>

          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <Button
              variant={tempStatus === "NORMAL" ? "contained" : "outlined"}
              color="inherit"
              startIcon={<CheckCircleIcon />}
              onClick={() => setTempStatus("NORMAL")}
              sx={{ justifyContent: "flex-start", py: 1 }}
            >
              Dictado Normal de Clase
            </Button>

            <Button
              variant={
                tempStatus === "TEACHER_ABSENT" ? "contained" : "outlined"
              }
              color="warning"
              startIcon={<PersonOffIcon />}
              onClick={() => setTempStatus("TEACHER_ABSENT")}
              sx={{ justifyContent: "flex-start", py: 1 }}
            >
              Ausencia Docente / Hora Libre
            </Button>

            <Button
              variant={
                tempStatus === "INSTITUTIONAL_OUTING" ? "contained" : "outlined"
              }
              color="info"
              startIcon={<DirectionsBusIcon />}
              onClick={() => setTempStatus("INSTITUTIONAL_OUTING")}
              sx={{ justifyContent: "flex-start", py: 1 }}
            >
              Salida Institucional / Excursión
            </Button>
          </Stack>

          <TextField
            fullWidth
            size="small"
            label="Observación u orden de salida (opcional)"
            placeholder="Ej: Salida a Museo a las 10:00 hs"
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditingCourse(null)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveStatus}
            variant="contained"
            disableElevation
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActiveScheduleCards;
