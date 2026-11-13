import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress } from '@mui/material'

import MainLayout from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { EdteMeetingForm } from '@/components/edte/EdteMeetingForm'
import { sectionLabel, studentLabel } from '@/components/edte/useMeetingParticipants'
import { useLazyResource } from '@/hooks/useLazyResource'
import { getEdteMeeting } from '@/services/edteMeeting.service'
import { getStudentById } from '@/services/studentProfile.service'

// Alta y edición de una reunión del EDTE (CRM-075). Esta página carga la reunión y decide qué
// mostrar: mientras carga, si falla o si ya está firmada NO se renderiza el formulario (una
// reunión firmada no se puede editar); recién con los datos listos monta EdteMeetingForm.
export const EdteMeetingFormPage = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  // Alumno para sumar de entrada: viene de "Agregar a reunión" de la pantalla de derivados (CRM-074)
  const [searchParams] = useSearchParams()
  const studentId = searchParams.get('studentId')

  const meeting = useLazyResource(id ? `edte-meeting:${id}` : null, (signal) =>
    getEdteMeeting(id ?? '', signal)
  )
  const student = useLazyResource(studentId ? `student:${studentId}` : null, (signal) =>
    getStudentById(studentId ?? '', signal)
  )
  // El formulario arma su lista de alumnos al montarse: se espera a tener al alumno. Si no se
  // pudo cargar, se abre igual el formulario, sin él, con un aviso
  const waitingStudent = Boolean(studentId) && student.loading
  const initialStudent = student.data
    ? {
        studentId: student.data.id,
        label: studentLabel(student.data),
        detail: sectionLabel(student.data.currentSection),
      }
    : undefined

  const header = (
    <PageHeader
      title={isEdit ? 'Editar reunión del EDTE' : 'Nueva reunión del EDTE'}
      breadcrumbs={[
        { label: 'Inicio', href: '/home' },
        { label: 'Reuniones del EDTE', href: '/edte-meetings' },
        { label: isEdit ? 'Editar' : 'Nueva' },
      ]}
    />
  )

  // Estados de la edición: cargando, error o reunión ya firmada
  if (isEdit && (meeting.loading || meeting.error || meeting.data?.status === 'SIGNED')) {
    return (
      <MainLayout>
        <PageContainer>
          {header}
          {meeting.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Alert
              severity={meeting.error ? 'error' : 'info'}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => navigate(`/edte-meetings/${id}`)}
                >
                  Ver la reunión
                </Button>
              }
            >
              {meeting.error
                ? `No se pudo cargar la reunión. ${meeting.error}`
                : 'La reunión ya está firmada: no se puede editar.'}
            </Alert>
          )}
        </PageContainer>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <PageContainer>
        {header}
        {student.error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No se pudo cargar el alumno para sumarlo a la reunión: agregalo desde la lista de
            alumnos. {student.error}
          </Alert>
        )}
        {waitingStudent ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <EdteMeetingForm
            key={meeting.data?.id ?? 'new'}
            meeting={meeting.data}
            initialStudent={initialStudent}
          />
        )}
      </PageContainer>
    </MainLayout>
  )
}

export default EdteMeetingFormPage
