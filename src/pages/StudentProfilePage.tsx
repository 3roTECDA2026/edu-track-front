// src/pages/StudentProfilePage.tsx
import { useState, type SyntheticEvent } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Link,
  Paper,
  Skeleton,
  Snackbar,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { DeactivateStudentDialog } from '@/components/students/DeactivateStudentDialog';
import { ProfileHeader } from '@/components/studentProfile/ProfileHeader';
import { PersonalDataTab } from '@/components/studentProfile/PersonalDataTab';
import { EnrollmentTab } from '@/components/studentProfile/EnrollmentTab';
import { AttendanceTab } from '@/components/studentProfile/AttendanceTab';
import { GradesTab } from '@/components/studentProfile/GradesTab';
import { ObservationsTab } from '@/components/studentProfile/ObservationsTab';
import { useLazyResource } from '@/hooks/useLazyResource';
import { deactivateStudent } from '@/services/students.service';
import {
  getStudentAttendance,
  getStudentById,
  getStudentGrades,
  getStudentHistory,
} from '@/services/studentProfile.service';

type TabKey = 'personal' | 'enrollment' | 'attendance' | 'grades' | 'observations';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'personal', label: 'Datos personales' },
  { key: 'enrollment', label: 'Inscripción' },
  { key: 'attendance', label: 'Asistencia' },
  { key: 'grades', label: 'Calificaciones' },
  { key: 'observations', label: 'Observaciones' },
];

interface SnackbarState {
  message: string;
  severity: 'success' | 'error' | 'info';
}

const StudentProfilePage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  // Tabs load their data the first time they are opened.
  const [visitedTabs, setVisitedTabs] = useState<TabKey[]>(['personal']);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  const studentResource = useLazyResource(id ? `student:${id}` : null, (signal) => getStudentById(id, signal));
  const student = studentResource.data;
  const currentYear = student?.currentSection?.year;

  const history = useLazyResource(visitedTabs.includes('enrollment') ? `history:${id}` : null, (signal) =>
    getStudentHistory(id, signal),
  );
  const attendance = useLazyResource(
    visitedTabs.includes('attendance') && student ? `attendance:${id}:${currentYear ?? 'all'}` : null,
    (signal) => getStudentAttendance(id, currentYear, signal),
  );
  const grades = useLazyResource(visitedTabs.includes('grades') ? `grades:${id}` : null, (signal) =>
    getStudentGrades(id, signal),
  );

  const handleTabChange = (_: SyntheticEvent, value: TabKey) => {
    setActiveTab(value);
    setVisitedTabs((prev) => (prev.includes(value) ? prev : [...prev, value]));
  };

  const handleConfirmDeactivate = async () => {
    if (!student) return;
    setDeactivating(true);

    try {
      await deactivateStudent(student.id);
      setDialogOpen(false);
      setSnackbar({ message: `${student.firstName} ${student.lastName} fue dado de baja.`, severity: 'success' });
      studentResource.reload();
    } catch (err: unknown) {
      setSnackbar({
        message: err instanceof Error ? err.message : 'No se pudo cambiar el estado del estudiante.',
        severity: 'error',
      });
    } finally {
      setDeactivating(false);
    }
  };

  const renderContent = () => {
    if (!student) {
      if (studentResource.error) {
        return (
          <Alert
            severity="error"
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button color="inherit" size="small" onClick={studentResource.reload}>
                  Reintentar
                </Button>
                <Button color="inherit" size="small" onClick={() => navigate('/students')}>
                  Volver al listado
                </Button>
              </Box>
            }
          >
            No se pudo cargar la ficha del estudiante. {studentResource.error}
          </Alert>
        );
      }

      return (
        <>
          <Paper variant="outlined" sx={{ borderRadius: 2, p: 3, display: 'flex', gap: 3, alignItems: 'center' }}>
            <Skeleton variant="circular" width={72} height={72} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="40%" height={36} />
              <Skeleton variant="text" width="60%" />
            </Box>
          </Paper>
          <Skeleton variant="rounded" height={48} sx={{ mt: 3 }} />
          <Skeleton variant="rounded" height={240} sx={{ mt: 3 }} />
        </>
      );
    }

    return (
      <>
        <ProfileHeader
          student={student}
          onEdit={() =>
            // TODO: navigate(`/students/${student.id}/edit`) when the edit page exists.
            setSnackbar({ message: 'La edición de datos va a estar disponible próximamente.', severity: 'info' })
          }
          onRegisterAttendance={() => navigate('/attendance')}
          onChangeStatus={() => setDialogOpen(true)}
        />

        <Box sx={{ borderBottom: '1px solid #e0e0e0', mt: 3, mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            textColor="inherit"
            sx={{ '& .MuiTabs-indicator': { backgroundColor: '#202124' } }}
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.key}
                value={tab.key}
                label={tab.label}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.9rem' }}
              />
            ))}
          </Tabs>
        </Box>

        {activeTab === 'personal' && <PersonalDataTab student={student} />}
        {activeTab === 'enrollment' && (
          <EnrollmentTab
            student={student}
            history={history.data}
            loading={history.loading}
            error={history.error}
            onRetry={history.reload}
          />
        )}
        {activeTab === 'attendance' && (
          <AttendanceTab
            records={attendance.data}
            loading={attendance.loading}
            error={attendance.error}
            onRetry={attendance.reload}
          />
        )}
        {activeTab === 'grades' && (
          <GradesTab grades={grades.data} loading={grades.loading} error={grades.error} onRetry={grades.reload} />
        )}
        {activeTab === 'observations' && (
          <ObservationsTab
            key={student.id}
            studentId={student.id}
            onSaved={(message, severity) => setSnackbar({ message, severity })}
          />
        )}
      </>
    );
  };

  return (
    <MainLayout>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/students" underline="hover" color="inherit">
          Alumnos
        </Link>
        <Typography sx={{ color: 'text.primary' }}>
          {student ? `Ficha de ${student.firstName} ${student.lastName}` : 'Ficha del alumno'}
        </Typography>
      </Breadcrumbs>

      {renderContent()}

      <DeactivateStudentDialog
        open={dialogOpen}
        student={student ?? null}
        loading={deactivating}
        onConfirm={handleConfirmDeactivate}
        onClose={() => setDialogOpen(false)}
      />

      <Snackbar
        open={snackbar !== null}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {snackbar ? (
          <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(null)}>
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </MainLayout>
  );
};

export default StudentProfilePage;