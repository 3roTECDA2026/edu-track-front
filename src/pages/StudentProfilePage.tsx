// src/pages/StudentProfilePage.tsx
import { useEffect, useState, type SyntheticEvent } from 'react'
import { Alert, Box, Button, Skeleton, Snackbar } from '@mui/material'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import { useNavigate, useParams } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { AddButton } from '@/components/common/AddButton'
import { ContentCard } from '@/components/common/ContentCard'
import { CustomTabs } from '@/components/common/CustomTabs'
import { DeactivateStudentDialog } from '@/components/students/DeactivateStudentDialog'
import { StudentFormDialog } from '@/components/students/StudentFormDialog'
import { ProfileHeader } from '@/components/studentProfile/ProfileHeader'
import { PersonalDataTab } from '@/components/studentProfile/PersonalDataTab'
import { EnrollmentTab } from '@/components/studentProfile/EnrollmentTab'
import { AttendanceTab } from '@/components/studentProfile/AttendanceTab'
import { GradesTab } from '@/components/studentProfile/GradesTab'
import { ObservationsTab } from '@/components/studentProfile/ObservationsTab'
import { RiteTab } from '@/components/studentProfile/RiteTab'
import { InterventionsTab } from '@/components/studentProfile/InterventionsTab'
import { FortePlanTab } from '@/components/studentProfile/FortePlanTab'
import { FortePlanDialog } from '@/components/studentProfile/FortePlanDialog'
import { useLazyResource } from '@/hooks/useLazyResource'
import { deactivateStudent } from '@/services/students.service'
import { getStudentFortePlan } from '@/services/fortePlan.service'
import { canManageTrajectories } from '@/services/session'
import {
  getStudentAttendance,
  getStudentById,
  getStudentGrades,
  getStudentHistory,
} from '@/services/studentProfile.service'
import { currentUser } from '@/utils/currentUser'

type TabKey =
  | 'personal'
  | 'enrollment'
  | 'attendance'
  | 'grades'
  | 'observations'
  | 'interventions'
  | 'rite'
  | 'forte'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'personal', label: 'Datos personales' },
  { key: 'enrollment', label: 'Inscripción' },
  { key: 'attendance', label: 'Asistencia' },
  { key: 'grades', label: 'Calificaciones' },
  { key: 'observations', label: 'Observaciones' },
  { key: 'interventions', label: 'Intervenciones' },
  { key: 'rite', label: 'RITE' },
]

// Pestaña del Plan Forte: solo para los alumnos asignados al programa (CRM-089)
const FORTE_TAB: { key: TabKey; label: string } = { key: 'forte', label: 'Plan Forte' }

interface SnackbarState {
  message: string
  severity: 'success' | 'error' | 'info'
}

const StudentProfilePage = () => {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<TabKey>('personal')
  // Cada pestaña carga sus datos la primera vez que se abre
  const [visitedTabs, setVisitedTabs] = useState<TabKey[]>(['personal'])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  // Diálogo del Plan Forte: asignar (o volver a asignar) o editar el plan (CRM-089)
  const [forteDialog, setForteDialog] = useState<'assign' | 'edit' | null>(null)
  // Después de asignar, se abre la pestaña del Plan Forte recién cuando llega el plan
  const [openForteWhenLoaded, setOpenForteWhenLoaded] = useState(false)

  const studentResource = useLazyResource(id ? `student:${id}` : null, (signal) =>
    getStudentById(id, signal)
  )
  const student = studentResource.data
  const currentYear = student?.currentSection?.year

  // El plan Forte se busca al abrir la ficha, porque decide si se muestra su pestaña (CRM-089).
  // data: el plan; null: no tiene plan; undefined: todavía no llegó o el pedido falló
  const fortePlan = useLazyResource(id ? `forte-plan:${id}` : null, (signal) =>
    getStudentFortePlan(id, signal)
  )
  const tabs = fortePlan.data ? [...TABS, FORTE_TAB] : TABS
  const canManageForte = canManageTrajectories()
  // Los reportes los cargan quien gestiona o el responsable del plan (igual que el back)
  const canLoadForteReports =
    canManageForte ||
    (fortePlan.data?.responsible?.id !== undefined &&
      fortePlan.data.responsible.id === currentUser().userId)

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
  const grades = useLazyResource(visitedTabs.includes('grades') ? `grades:${id}` : null, (signal) =>
    getStudentGrades(id, signal)
  )

  // Cuando llega el plan recién asignado, se abre su pestaña
  useEffect(() => {
    if (openForteWhenLoaded && fortePlan.data) {
      setActiveTab('forte')
      setOpenForteWhenLoaded(false)
    }
  }, [openForteWhenLoaded, fortePlan.data])

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.key === activeTab)
  )

  // CustomTabs trabaja con el índice de la pestaña, por eso acá se traduce a su clave
  const handleTabChange = (_: SyntheticEvent, index: number) => {
    const key = tabs[index].key
    setActiveTab(key)
    setVisitedTabs((prev) => (prev.includes(key) ? prev : [...prev, key]))
  }

  // Después de asignar, editar o cambiar el estado: se recarga el plan y se muestra su pestaña
  const handleForteSaved = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ message, severity })
    fortePlan.reload()
    setOpenForteWhenLoaded(true)
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

      // Esqueleto mientras carga la ficha
      return (
        <>
          <ContentCard sx={{ p: 3, display: 'flex', gap: 3, alignItems: 'center' }}>
            <Skeleton variant="circular" width={72} height={72} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="text" width="60%" />
            </Box>
          </ContentCard>
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

        {/* Asignar al Plan Forte: solo si el alumno de verdad no tiene plan (data === null).
            Si el pedido falló, data es undefined y el botón no aparece (CRM-089) */}
        {canManageForte && fortePlan.data === null && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="outlined" color="inherit" onClick={() => setForteDialog('assign')}>
              Asignar al Plan Forte
            </Button>
          </Box>
        )}

        {/* Pestañas dentro de la tarjeta estándar */}
        <ContentCard sx={{ mt: 3 }}>
          <CustomTabs
            tabs={tabs.map((tab) => tab.label)}
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
            {activeTab === 'interventions' && <InterventionsTab studentId={student.id} />}
            {activeTab === 'rite' && <RiteTab studentId={student.id} />}
            {activeTab === 'forte' && fortePlan.data && (
              <FortePlanTab
                plan={fortePlan.data}
                canManage={canManageForte}
                canLoadReports={canLoadForteReports}
                onEdit={() => setForteDialog('edit')}
                onReassign={() => setForteDialog('assign')}
                onSaved={handleForteSaved}
              />
            )}
          </Box>
        </ContentCard>
      </>
    )
  }

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Ficha del alumno"
          subtitle="Datos personales, inscripción, asistencia y calificaciones del estudiante."
          breadcrumbs={[
            { label: 'Inicio', href: '/home' },
            { label: 'Estudiantes', href: '/students' },
            { label: student ? `${student.lastName}, ${student.firstName}` : 'Ficha del alumno' },
          ]}
          action={
            student ? (
              <AddButton
                label="Registrar intervención"
                icon={<NoteAddIcon />}
                onClick={() => navigate(`/interventions/new?studentId=${student.id}`)}
              />
            ) : undefined
          }
        />

        {renderContent()}
      </PageContainer>

      {/* Asignar o editar el Plan Forte (CRM-089) */}
      {student && (
        <FortePlanDialog
          open={forteDialog !== null}
          mode={forteDialog ?? 'assign'}
          studentId={student.id}
          studentName={`${student.lastName}, ${student.firstName}`}
          plan={fortePlan.data ?? null}
          onClose={() => setForteDialog(null)}
          onSaved={(message) => handleForteSaved(message)}
        />
      )}

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

export default StudentProfilePage
