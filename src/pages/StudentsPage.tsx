import { useState } from 'react'
import { Alert, Box, Button, Snackbar } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import MainLayout from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { AddButton } from '@/components/common/AddButton'
import { StandardTablePagination } from '@/components/common/StandardTablePagination'
import { StudentFilters, type StudentFiltersState } from '@/components/students/StudentFilters'
import { StudentsTable } from '@/components/students/StudentsTable'
import { StudentsEmptyState } from '@/components/students/StudentsEmptyState'
import { DeactivateStudentDialog } from '@/components/students/DeactivateStudentDialog'
import { StudentFormDialog } from '@/components/students/StudentFormDialog'
import { useDebounce } from '@/hooks/useDebounce'
import { useStudents } from '@/hooks/useStudents'
import { deactivateStudent, type StudentListItem } from '@/services/students.service'

const DEFAULT_ROWS_PER_PAGE = 10

const INITIAL_FILTERS: StudentFiltersState = {
  search: '',
  grade: '',
  division: '',
  shift: '',
  status: 'active',
}

interface SnackbarState {
  message: string
  severity: 'success' | 'error'
}

export const StudentsPage = () => {
  const navigate = useNavigate()

  const [filters, setFilters] = useState<StudentFiltersState>(INITIAL_FILTERS)
  // El back pagina desde 1; el paginado común (MUI) cuenta desde 0
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE)

  const [studentToDeactivate, setStudentToDeactivate] = useState<StudentListItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editStudentId, setEditStudentId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(filters.search.trim(), 400)

  const {
    data: result,
    loading,
    error,
    reload,
  } = useStudents({
    page,
    limit: rowsPerPage,
    search: debouncedSearch,
    grade: filters.grade,
    division: filters.division,
    shift: filters.shift,
    status: filters.status,
  })

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.grade !== '' ||
    filters.division !== '' ||
    filters.shift !== '' ||
    filters.status !== INITIAL_FILTERS.status

  const handleFiltersChange = (changes: Partial<StudentFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...changes }))
    setPage(1)
  }

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS)
    setPage(1)
  }

  const handleOpenDeactivate = (student: StudentListItem) => {
    setStudentToDeactivate(student)
    setDialogOpen(true)
  }

  const handleConfirmDeactivate = async () => {
    if (!studentToDeactivate) return
    setDeactivating(true)

    try {
      await deactivateStudent(studentToDeactivate.id)
      setDialogOpen(false)
      setSnackbar({
        message: `${studentToDeactivate.firstName} ${studentToDeactivate.lastName} fue dado de baja.`,
        severity: 'success',
      })

      if (result && result.data.length === 1 && page > 1) {
        setPage((prev) => prev - 1)
      } else {
        reload()
      }
    } catch (err: unknown) {
      setSnackbar({
        message: err instanceof Error ? err.message : 'No se pudo dar de baja al estudiante.',
        severity: 'error',
      })
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Listado de estudiantes"
          subtitle="Buscá, filtrá y gestioná los estudiantes de la institución."
          breadcrumbs={[
            { label: 'Inicio', href: '/home' },
            { label: 'Estudiantes', href: '/students' },
            { label: 'Listado' },
          ]}
          action={<AddButton label="Alta estudiante" onClick={() => setCreateOpen(true)} />}
        />

        {/* Tarjeta contenedora estándar: filtros, tabla y paginado */}
        <ContentCard>
          <Box sx={{ p: 2, backgroundColor: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
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
                onEdit={(student) => setEditStudentId(student.id)}
                onDeactivate={handleOpenDeactivate}
              />

              {result && (
                <StandardTablePagination
                  count={result.total}
                  page={page - 1}
                  rowsPerPage={rowsPerPage}
                  onPageChange={(next) => setPage(next + 1)}
                  onRowsPerPageChange={(rows) => {
                    setRowsPerPage(rows)
                    setPage(1)
                  }}
                  itemLabel="estudiantes"
                  sx={{ borderTop: '1px solid #e5e7eb' }}
                />
              )}
            </>
          )}
        </ContentCard>
      </PageContainer>

      <DeactivateStudentDialog
        open={dialogOpen}
        student={studentToDeactivate}
        loading={deactivating}
        onConfirm={handleConfirmDeactivate}
        onClose={() => setDialogOpen(false)}
      />

      <StudentFormDialog open={createOpen} onClose={() => setCreateOpen(false)} onSaved={reload} />

      <StudentFormDialog
        mode="edit"
        studentId={editStudentId}
        open={editStudentId !== null}
        onClose={() => setEditStudentId(null)}
        onSaved={reload}
      />

      {/* Mensajes de las acciones, con el Snackbar acordado en el proyecto */}
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
  )
}

export default StudentsPage
