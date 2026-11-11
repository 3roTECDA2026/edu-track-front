import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress } from '@mui/material'

import MainLayout from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { EdteMeetingForm } from '@/components/edte/EdteMeetingForm'
import { useLazyResource } from '@/hooks/useLazyResource'
import { getEdteMeeting } from '@/services/edteMeeting.service'

// Alta y edición de una reunión del EDTE (CRM-075). Esta página carga la reunión y decide qué
// mostrar: mientras carga, si falla o si ya está firmada NO se renderiza el formulario (una
// reunión firmada no se puede editar); recién con los datos listos monta EdteMeetingForm.
export const EdteMeetingFormPage = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const meeting = useLazyResource(id ? `edte-meeting:${id}` : null, (signal) =>
    getEdteMeeting(id ?? '', signal)
  )

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
        <EdteMeetingForm key={meeting.data?.id ?? 'new'} meeting={meeting.data} />
      </PageContainer>
    </MainLayout>
  )
}

export default EdteMeetingFormPage
