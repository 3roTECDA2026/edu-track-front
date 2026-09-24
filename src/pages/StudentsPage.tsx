
import { useState } from 'react';
import { Alert, Box, Button, Pagination, Paper, Snackbar, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { StudentFilters, type StudentFiltersState } from '@/components/students/StudentFilters';
import { StudentsTable } from '@/components/students/StudentsTable';
import { StudentsEmptyState } from '@/components/students/StudentsEmptyState';
import { DeactivateStudentDialog } from '@/components/students/DeactivateStudentDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { useStudents } from '@/hooks/useStudents';
import { deactivateStudent, type StudentListItem } from '@/services/students.service';

const PAGE_SIZE = 20;

const INITIAL_FILTERS: StudentFiltersState = {
  search: '',
  grade: '',
  division: '',
  shift: '',
  status: 'active',
};

interface SnackbarState {
  message: string;
  severity: 'success' | 'error';
}

export const StudentsPage = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<StudentFiltersState>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);

  const [studentToDeactivate, setStudentToDeactivate] = useState<StudentListItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  const debouncedSearch = useDebounce(filters.search.trim(), 400);

  const {
    data: result,
    loading,
    error,
    reload,
  } = useStudents({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch,
    grade: filters.grade,
    division: filters.division,
    shift: filters.shift,
    status: filters.status,
  });

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.grade !== '' ||
    filters.division !== '' ||
    filters.shift !== '' ||
    filters.status !== INITIAL_FILTERS.status;

  const handleFiltersChange = (changes: Partial<StudentFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...changes }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  const handleOpenDeactivate = (student: StudentListItem) => {
    setStudentToDeactivate(student);
    setDialogOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!studentToDeactivate) return;
    setDeactivating(true);

    try {
      await deactivateStudent(studentToDeactivate.id);
      setDialogOpen(false);
      setSnackbar({
        message: `${studentToDeactivate.firstName} ${studentToDeactivate.lastName} fue dado de baja.`,
        severity: 'success',
      });

      if (result && result.data.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        reload();
      }
    } catch (err: unknown) {
      setSnackbar({
        message: err instanceof Error ? err.message : 'No se pudo dar de baja al estudiante.',
        severity: 'error',
      });
    } finally {
      setDeactivating(false);
    }
  };

  const from = result && result.total > 0 ? (result.page - 1) * PAGE_SIZE + 1 : 0;
  const to = result ? from + result.data.length - 1 : 0;

  return (
    <MainLayout>
      <Box className="students-page" sx={{ maxWidth: 1280, mx: 'auto' }}>
        {/* Breadcrumbs con el estilo de Attendance */}
        <Box className="print-hidden" sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ color: '#7b8794' }}>
            Inicio &nbsp;›&nbsp; Estudiantes &nbsp;›&nbsp; <strong>Listado</strong>
          </Typography>
        </Box>

        {/* Encabezado correcto del módulo */}
        <Stack sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#202124', fontWeight: 800, fontSize: { xs: '1.65rem', md: '2rem' } }}>
              Listado de estudiantes
            </Typography>
            <Typography variant="body2" sx={{ color: '#7b8794' }}>
              Buscá, filtrá y gestioná los estudiantes de la institución.
            </Typography>
          </Box>
        </Stack>

        {/* Contenedor principal con estilo Attendance */}
        <Paper variant="outlined" sx={{ borderRadius: 1, borderColor: '#e1e5e8', overflow: 'hidden' }}>
          <Box sx={{ p: 2, backgroundColor: '#fafafa', borderBottom: '1px solid #e1e5e8' }}>
            <StudentFilters
              filters={filters}
              hasActiveFilters={hasActiveFilters}
              onChange={handleFiltersChange}
              onClear={handleClearFilters}
            />
          </Box>

          {error ? (
            <Alert
              severity="error"
              sx={{ m: 2 }}
              action={
                <Button color="inherit" size="small" onClick={reload}>
                  Reintentar
                </Button>
              }
            >
              No se pudo cargar el listado de estudiantes. {error}
            </Alert>
          ) : !loading && result?.total === 0 ? (
            <StudentsEmptyState hasActiveFilters={hasActiveFilters} onClear={handleClearFilters} />
          ) : (
            <>
              <StudentsTable
                students={result?.data ?? []}
                loading={loading}
                onView={(student) => navigate(`/students/${student.id}`)}
                onEdit={(student) => navigate(`/students/${student.id}/edit`)}
                onDeactivate={handleOpenDeactivate}
              />

              {result && (
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#fafafa',
                    borderTop: '1px solid #e1e5e8',
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#7b8794' }}>
                    Mostrando {from}–{to} de {result.total} estudiantes
                  </Typography>
                  {result.totalPages > 1 && (
                    <Pagination
                      count={result.totalPages}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                      shape="rounded"
                      size="small"
                    />
                  )}
                </Box>
              )}
            </>
          )}
        </Paper>
      </Box>

      <DeactivateStudentDialog
        open={dialogOpen}
        student={studentToDeactivate}
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

export default StudentsPage;