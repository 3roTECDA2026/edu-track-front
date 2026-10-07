// src/pages/StudentProfilePage.tsx
import { useState, type SyntheticEvent } from 'react'
import { Alert, Box, Button, Paper, Skeleton, Snackbar } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { CustomTabs } from '@/components/common/CustomTabs'
import { DeactivateStudentDialog } from '@/components/students/DeactivateStudentDialog'
import { StudentFormDialog } from '@/components/students/StudentFormDialog'
import { ProfileHeader } from '@/components/studentProfile/ProfileHeader'
import { PersonalDataTab } from '@/components/studentProfile/PersonalDataTab'
import { EnrollmentTab } from '@/components/studentProfile/EnrollmentTab'
import { AttendanceTab } from '@/components/studentProfile/AttendanceTab'
import { GradesTab } from '@/components/studentProfile/GradesTab'
import { ObservationsTab } from '@/components/studentProfile/ObservationsTab'
import { cardSx } from '@/components/studentProfile/profileStyles'
import { useLazyResource } from '@/hooks/useLazyResource'
import { deactivateStudent } from '@/services/students.service'
import {
  getStudentAttendance,
  getStudentById,
  getStudentGrades,
  getStudentHistory,
} from '@/services/studentProfile.service'

type TabKey = 'personal' | 'enrollment' | 'attendance' | 'grades' | 'observations'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'personal', label: 'Datos personales' },
  { key: 'enrollment', label: 'Inscripción' },
  { key: 'attendance', label: 'Asistencia' },
  { key: 'grades', label: 'Calificaciones' },
  { key: 'observations', label: 'Observaciones' },
]

interface SnackbarState {
  message: string
  severity: 'success' | 'error' | 'info'
}

const StudentProfilePage = () => {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<TabKey>('personal')
  // Cada tab carga sus datos la primera vez que se abre.
  const [visitedTabs, setVisitedTabs] = useState<TabKey[]>(['personal'])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const studentResource = useLazyResource(id ? `student:${id}` : null, (signal) =>
    getStudentById(id, signal)
  )
  const student = studentResource.data
  const currentYear = student?.currentSection?.year

  const history = useLazyResource(
    visitedTabs.includes('enrollment') ? `history:${id}` : null,
    (signal) => getStudentHistory(id, signal)
  )
  const attendance = useLazyResource(
    visitedTabs.includes('attendance') && student
      ? `attendance:${id}:${currentYear ?? 'all'}`
      : null,
    (signal) => getStudentAttendance(id, currentYear, signal)
  )
  const grades = useLazyResource(
    visitedTabs.includes('grades') ? `grades:${id}` : null,
    (signal) => getStudentGrades(id, signal)
  )

  const activeIndex = TABS.findIndex((tab) => tab.key === activeTab)

  // CustomTabs trabaja con el índice de la pestaña, por eso acá se traduce a su clave.
  const handleTabChange = (_: SyntheticEvent, index: number) => {
    const key = TABS[index].key
    setActiveTab(key)
    setVisitedTabs((prev) => (prev.includes(key) ? prev : [...prev, key]))
  }

  const handleConfirmDeactivate = async () => {
    if (!student) return
    setDeactivating(true)

    try {
      await deactivateStudent(student.id)
      setDialogOpen(false)
      setSnackbar({
        message: `${student.firstName} ${student.lastName} fue dado de baja.`,
        severity: 'success',
      })
      studentResource.reload()
    } catch (err: unknown) {
      setSnackbar({
        message:
          err instanceof Error ? err.message : 'No se pudo cambiar el estado del estudiante.',
        severity: 'error',
      })
    } finally {
      setDeactivating(false)
    }
  }

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
        )
      }

      return (
        <>
          <Paper
            variant="outlined"
            sx={{ ...cardSx, p: 3, display: 'flex', gap: 3, alignItems: 'center' }}
          >
            <Skeleton variant="circular" width={72} height={72} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="text" width="60%" />
            </Box>
          </Paper>
          <Skeleton variant="rounded" height={320} sx={{ mt: 3 }} />
        </>
      )
    }

    return (
      <>
        <ProfileHeader
          student={student}
          onEdit={() => setEditOpen(true)}
          onRegisterAttendance={() => navigate('/attendance')}
          onChangeStatus={() => setDialogOpen(true)}
        />

        {/* Pestañas dentro de una tarjeta, como en la pantalla tipo del estándar */}
        <Paper variant="outlined" sx={{ ...cardSx, overflow: 'hidden', mt: 3 }}>
          <CustomTabs
            tabs={TABS.map((tab) => tab.label)}
            value={activeIndex}
            onChange={handleTabChange}
            variant="scrollable"
          />

          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
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
              <GradesTab
                grades={grades.data}
                loading={grades.loading}
                error={grades.error}
                onRetry={grades.reload}
              />
            )}
            {activeTab === 'observations' && (
              <ObservationsTab
                key={student.id}
                studentId={student.id}
                onSaved={(message, severity) => setSnackbar({ message, severity })}
              />
            )}
          </Box>
        </Paper>
      </>
    )
  }

  return (
    <MainLayout>
      <PageHeader
        title="Ficha del alumno"
        subtitle="Datos personales, inscripción, asistencia y calificaciones del estudiante."
        breadcrumbs={[
          { label: 'Alumnos', href: '/students', onClick: () => navigate('/students') },
          {
            label: student
              ? `Ficha de ${student.firstName} ${student.lastName}`
              : 'Ficha del alumno',
          },
        ]}
      />

      {renderContent()}

      <DeactivateStudentDialog
        open={dialogOpen}
        student={student ?? null}
        loading={deactivating}
        onConfirm={handleConfirmDeactivate}
        onClose={() => setDialogOpen(false)}
      />

      {/* Edición de datos: al guardar se recarga la ficha con los datos nuevos */}
      <StudentFormDialog
        mode="edit"
        studentId={student?.id ?? null}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={studentResource.reload}
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
  )
}

export default StudentProfilePage