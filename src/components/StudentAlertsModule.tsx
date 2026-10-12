import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Stack,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tooltip,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import GavelIcon from "@mui/icons-material/Gavel";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";

import { ContentCard } from "@/components/common/ContentCard";
import { CustomTabs } from "@/components/common/CustomTabs";
import {
  useStudentAlerts,
  type AlertType,
  type SeverityLevel,
  type StudentAlert,
} from "@/hooks/useStudentAlerts";

export const StudentAlertsModule: React.FC = () => {
  const { alerts, students, loading, error, createAlert, updateAlert } =
    useStudentAlerts();
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Estado del Modal de Edición
  const [selectedAlert, setSelectedAlert] = useState<StudentAlert | null>(null);
  const [editSeverity, setEditSeverity] = useState<SeverityLevel>("MEDIUM");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");
  const [editStatus, setEditStatus] = useState<"OPEN" | "RESOLVED">("OPEN");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newAlertType, setNewAlertType] =
    useState<Exclude<AlertType, "ACADEMIC">>("HEALTH");
  const [newAlertStudentId, setNewAlertStudentId] = useState<string>("");
  const [newAlertMessage, setNewAlertMessage] = useState<string>("");

  // Mapeo de Categorías
  const alertCategories: {
    type: AlertType | "ALL";
    label: string;
    icon: React.ReactElement;
    color: string;
  }[] = [
    {
      type: "ALL",
      label: "Todas",
      icon: <WarningAmberIcon fontSize="small" />,
      color: "#111827",
    },
    {
      type: "ABSENCE",
      label: "Inasistencias",
      icon: <WarningAmberIcon fontSize="small" />,
      color: "#dc2626",
    },
    {
      type: "HEALTH",
      label: "Salud / Enfermos",
      icon: <LocalHospitalIcon fontSize="small" />,
      color: "#111827",
    },
    {
      type: "CONDUCT",
      label: "Mala Conducta",
      icon: <GavelIcon fontSize="small" />,
      color: "#374151",
    },
    {
      type: "ACADEMIC",
      label: "Bajas Notas",
      icon: <TrendingDownIcon fontSize="small" />,
      color: "#111827",
    },
  ];

  // Filtros aplicados
  const activeType = alertCategories[currentTab].type;
  const normalizedSearchTerms = searchQuery
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesTab = activeType === "ALL" || alert.type === activeType;
    const searchableText = [
      alert.studentName,
      alert.studentId,
      alert.sectionName,
      alert.title,
      alert.description,
    ]
      .join(" ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const matchesSearch = normalizedSearchTerms.every((term) =>
      searchableText.includes(term),
    );
    return matchesTab && matchesSearch;
  });

  // Métricas para los KPIs del encabezado
  const getCountByType = (type: AlertType) =>
    alerts.filter((a) => a.type === type && a.status === "OPEN").length;

  // Handlers del Modal
  const handleOpenEdit = (alert: StudentAlert) => {
    setSelectedAlert(alert);
    setEditSeverity(alert.severity);
    setEditDescription(alert.description);
    setEditNote(alert.note || "");
    setEditStatus(alert.status);
  };

  const handleSaveAlert = async () => {
    if (!selectedAlert) return;

    const updatedAlert = await updateAlert(selectedAlert.id, {
      type: selectedAlert.type,
      severity: editSeverity,
      message: editDescription,
      read: editStatus === "RESOLVED",
    });

    if (updatedAlert) setSelectedAlert(null);
  };

  const handleCreateAlert = async () => {
    const createdAlert = await createAlert({
      studentId: newAlertStudentId || students[0]?.id || "",
      type: newAlertType,
      message: newAlertMessage,
    });

    if (createdAlert) {
      setCreateDialogOpen(false);
      setNewAlertMessage("");
      setNewAlertType("HEALTH");
      setNewAlertStudentId("");
    }
  };

  const getSeverityChip = (severity: SeverityLevel) => {
    switch (severity) {
      case "HIGH":
        return (
          <Chip
            label="Alta"
            size="small"
            sx={{
              fontWeight: 700,
              backgroundColor: "#dc2626",
              color: "#ffffff",
            }}
          />
        );
      case "MEDIUM":
        return (
          <Chip
            label="Media"
            size="small"
            sx={{
              fontWeight: 700,
              backgroundColor: "#111827",
              color: "#ffffff",
            }}
          />
        );
      case "LOW":
        return (
          <Chip
            label="Baja"
            size="small"
            sx={{
              fontWeight: 700,
              backgroundColor: "#374151",
              color: "#ffffff",
            }}
          />
        );
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: "0 auto" }}>
      {/* Encabezado Principal */}
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827" }}>
            Alertas y Trayectorias Estudiantiles
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Seguimiento de inasistencias, salud, disciplina y rendimiento
            académico.
          </Typography>
        </Box>

        <Button
          variant="contained"
          disableElevation
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            borderRadius: 2,
            backgroundColor: "#111827",
            color: "#ffffff",
            fontWeight: 700,
            px: 2,
            py: 1,
            "&:hover": { backgroundColor: "#1f2937" },
          }}
        >
          + Nueva alerta
        </Button>
      </Stack>

      {/* Tarjetas de Resumen KPI */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              borderColor: "#e5e7eb",
              backgroundColor: "#f9fafb",
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "#111827", fontWeight: 700 }}
                  >
                    Inasistencias críticas
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, color: "#111827" }}
                  >
                    {getCountByType("ABSENCE")}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#dc2626", width: 44, height: 44 }}>
                  <WarningAmberIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              borderColor: "#e5e7eb",
              backgroundColor: "#f9fafb",
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "#111827", fontWeight: 700 }}
                  >
                    Salud / reposo
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, color: "#111827" }}
                  >
                    {getCountByType("HEALTH")}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#111827", width: 44, height: 44 }}>
                  <LocalHospitalIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              borderColor: "#e5e7eb",
              backgroundColor: "#f9fafb",
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "#111827", fontWeight: 700 }}
                  >
                    Reportes de conducta
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, color: "#111827" }}
                  >
                    {getCountByType("CONDUCT")}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#374151", width: 44, height: 44 }}>
                  <GavelIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              borderColor: "#e5e7eb",
              backgroundColor: "#f9fafb",
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "#111827", fontWeight: 700 }}
                  >
                    Bajos rendimientos
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, color: "#111827" }}
                  >
                    {getCountByType("ACADEMIC")}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#111827", width: 44, height: 44 }}>
                  <TrendingDownIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controles: Pestañas + Buscador */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          border: "1px solid #e5e7eb",
          borderRadius: 2,
          backgroundColor: "#ffffff",
          p: 1,
        }}
      >
        <CustomTabs
          tabs={alertCategories.map((cat) =>
            cat.type === "ALL"
              ? `Todas (${alerts.filter((a) => a.status === "OPEN").length})`
              : `${cat.label} (${getCountByType(cat.type as AlertType)})`,
          )}
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          containerSx={{ px: 0, pt: 0, borderBottom: "none" }}
        />

        <TextField
          size="small"
          placeholder="Buscar estudiante o curso..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 260 }}
        />
      </Stack>

      <ContentCard>
        <Grid container spacing={2} sx={{ p: 2 }}>
          {loading ? (
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 6,
                  color: "#6b7280",
                }}
              >
                <CircularProgress size={28} sx={{ mr: 2 }} />
                <Typography variant="h6">Cargando alertas reales...</Typography>
              </Box>
            </Grid>
          ) : error ? (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ textAlign: "center", py: 6, color: "#b91c1c" }}>
                <Typography variant="h6">{error}</Typography>
              </Box>
            </Grid>
          ) : filteredAlerts.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ textAlign: "center", py: 6, color: "#6b7280" }}>
                <Typography variant="h6">
                  No hay alertas registradas en esta categoría.
                </Typography>
              </Box>
            </Grid>
          ) : (
            filteredAlerts.map((alert) => (
              <Grid key={alert.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    opacity: alert.status === "RESOLVED" ? 0.65 : 1,
                    borderColor:
                      alert.status === "RESOLVED" ? "#e5e7eb" : undefined,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1.5,
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{ minWidth: 0, width: { xs: "100%", md: "auto" } }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "center", flexWrap: "wrap" }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 800,
                              color: "#111827",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {alert.studentName}
                          </Typography>
                          <Chip
                            label={alert.sectionName}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                          />
                        </Stack>
                        <Typography variant="caption" sx={{ color: "#6b7280" }}>
                          Registrado: {alert.createdAt}
                        </Typography>
                      </Box>

                      <Stack
                        direction="row"
                        spacing={0.5}
                        useFlexGap
                        sx={{
                          flexWrap: "wrap",
                          alignItems: "center",
                          justifyContent: { xs: "flex-start", md: "flex-end" },
                          width: { xs: "100%", md: "auto" },
                          minWidth: 0,
                        }}
                      >
                        <Chip
                          label={
                            alert.status === "RESOLVED"
                              ? "Resuelta"
                              : "Activa / Pendiente"
                          }
                          size="small"
                          color={
                            alert.status === "RESOLVED" ? "success" : "default"
                          }
                          variant={
                            alert.status === "RESOLVED" ? "filled" : "outlined"
                          }
                        />
                        {getSeverityChip(alert.severity)}
                        <Tooltip title="Editar Alerta">
                          <IconButton
                            size="small"
                            aria-label={`Editar alerta de ${alert.studentName}`}
                            onClick={() => handleOpenEdit(alert)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>

                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: "#374151", mb: 0.5 }}
                    >
                      {alert.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ color: "#4b5563", mb: 2 }}
                    >
                      {alert.description}
                    </Typography>

                    {Boolean(alert.valueMetric) && (
                      <Chip
                        label={alert.valueMetric}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: "#f3f4f6",
                          color: "#1f2937",
                          mb: 1.5,
                        }}
                      />
                    )}

                    {Boolean(alert.note) && (
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: "#f9fafb",
                          borderRadius: 1.5,
                          borderLeft: "3px solid #111827",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#4b5563",
                            display: "block",
                            fontStyle: "italic",
                          }}
                        >
                          Nota: "{alert.note}"
                        </Typography>
                      </Box>
                    )}

                    {alert.status === "RESOLVED" && (
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ mt: 1.5, color: "#111827", alignItems: "center" }}
                      >
                        <CheckCircleIcon fontSize="small" />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          Alerta Resuelta / En Seguimiento
                        </Typography>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </ContentCard>

      {/* Modal para Editar Alerta */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Crear nueva alerta</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Estudiante"
              value={newAlertStudentId}
              onChange={(e) => setNewAlertStudentId(e.target.value)}
              fullWidth
              size="small"
            >
              {students.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.lastName}, {student.firstName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Tipo de alerta"
              value={newAlertType}
              onChange={(e) =>
                setNewAlertType(
                  e.target.value as Exclude<AlertType, "ACADEMIC">,
                )
              }
              fullWidth
              size="small"
            >
              <MenuItem value="HEALTH">Salud / Enfermedad</MenuItem>
              <MenuItem value="CONDUCT">Mala conducta</MenuItem>
              <MenuItem value="ABSENCE">Inasistencia</MenuItem>
            </TextField>

            <TextField
              label="Detalle de la alerta"
              multiline
              rows={3}
              value={newAlertMessage}
              onChange={(e) => setNewAlertMessage(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleCreateAlert}
            variant="contained"
            disableElevation
            sx={{ borderRadius: 2 }}
          >
            Guardar alerta
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Editar Alerta: {selectedAlert?.studentName} (
          {selectedAlert?.sectionName})
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Severidad de la Alerta"
              value={editSeverity}
              onChange={(e) => setEditSeverity(e.target.value as SeverityLevel)}
              fullWidth
              size="small"
            >
              <MenuItem value="LOW">Baja</MenuItem>
              <MenuItem value="MEDIUM">Media</MenuItem>
              <MenuItem value="HIGH">Alta</MenuItem>
            </TextField>

            <TextField
              select
              label="Estado de la Alerta"
              value={editStatus}
              onChange={(e) =>
                setEditStatus(e.target.value as "OPEN" | "RESOLVED")
              }
              fullWidth
              size="small"
            >
              <MenuItem value="OPEN">Activa / Pendiente</MenuItem>
              <MenuItem value="RESOLVED">Resuelta / En Tratamiento</MenuItem>
            </TextField>

            <TextField
              label="Detalle / Descripción"
              multiline
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              fullWidth
            />

            <TextField
              label="Observación o Acuerdos con la Familia"
              multiline
              rows={2}
              placeholder="Ej: Se citó al tutor / Presentó certificado"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelectedAlert(null)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveAlert}
            variant="contained"
            disableElevation
            sx={{ borderRadius: 2 }}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAlertsModule;
