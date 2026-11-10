import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import DrawIcon from '@mui/icons-material/Draw'
import EditIcon from '@mui/icons-material/Edit'

import MainLayout from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { AddButton } from '@/components/common/AddButton'
import { useNotify } from '@/components/layout/NotificationProvider'
import { SoftBadge } from '@/components/studentProfile/SoftBadge'
import { SHIFT_LABELS } from '@/components/students/studentLabels'
import {
  EDTE_MANAGER_ROLES,
  MEETING_PERIOD_LABELS,
  MEETING_STATUS_CONFIG,
  formatMeetingDate,
  isSafeWebUrl,
  memberRoleLabel,
  pateStatusLabel,
} from '@/components/edte/edteLabels'
import { useLazyResource } from '@/hooks/useLazyResource'
import { getEdteMeeting, signEdteMeeting } from '@/services/edteMeeting.service'
import { currentUser } from '@/utils/currentUser'

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box>
    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
      {value}
    </Typography>
  </Box>
)

const headSx = { backgroundColor: '#fafafa' }

// Detalle de una reunión del EDTE (CRM-075): datos, integrantes, alumnos tratados con acceso a
// su ficha y a su PATE, y la acción de marcarla como firmada.
export const EdteMeetingDetailPage = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const notify = useNotify()
  const canManage = EDTE_MANAGER_ROLES.includes(currentUser().role ?? '')

  const meeting = useLazyResource(id ? `edte-meeting:${id}` : null, (signal) =>
    getEdteMeeting(id, signal)
  )
  const [confirmSign, setConfirmSign] = useState(false)
  const [signing, setSigning] = useState(false)

  const data = meeting.data
  const isDraft = data?.status === 'DRAFT'

  const handleSign = async () => {
    setSigning(true)
    try {
      await signEdteMeeting(id)
      notify.success('La reunión quedó marcada como firmada.')
      setConfirmSign(false)
      meeting.reload()
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'No se pudo marcar como firmada.')
    } finally {
      setSigning(false)
    }
  }

  const breadcrumbs = [
    { label: 'Inicio', href: '/home' },
    { label: 'Reuniones del EDTE', href: '/edte-meetings' },
    { label: data ? formatMeetingDate(data.date) : 'Detalle' },
  ]

  if (!data) {
    return (
      <MainLayout>
        <PageContainer>
          <PageHeader title="Reunión del EDTE" breadcrumbs={breadcrumbs} />
          {meeting.error ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={meeting.reload}>
                  Reintentar
                </Button>
              }
            >
              No se pudo cargar la reunión. {meeting.error}
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}
        </PageContainer>
      </MainLayout>
    )
  }

  const status = MEETING_STATUS_CONFIG[data.status]
  const present = data.members.filter((member) => member.present)
  const absent = data.members.filter((member) => !member.present)

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title={`Reunión de ${MEETING_PERIOD_LABELS[data.period].toLowerCase()} · ${formatMeetingDate(data.date)}`}
          subtitle={`Ciclo lectivo ${data.year}`}
          breadcrumbs={breadcrumbs}
          action={
            canManage && isDraft ? (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/edte-meetings/${id}/edit`)}
                >
                  Editar
                </Button>
                <AddButton
                  label="Marcar como firmada"
                  icon={<DrawIcon />}
                  onClick={() => setConfirmSign(true)}
                />
              </Stack>
            ) : undefined
          }
        />

        <Stack spacing={3}>
          {/* Datos de la reunión */}
          <ContentCard sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Datos de la reunión</Typography>
              <SoftBadge label={status.label} color={status.color} background={status.background} />
            </Stack>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
              }}
            >
              <Field label="Fecha" value={formatMeetingDate(data.date)} />
              <Field label="Período" value={MEETING_PERIOD_LABELS[data.period]} />
              <Field
                label="Turno"
                value={data.shift ? SHIFT_LABELS[data.shift] : 'Sin especificar'}
              />
              <Field
                label="Acta"
                value={
                  isSafeWebUrl(data.minutesUrl) ? (
                    <Link href={data.minutesUrl} target="_blank" rel="noopener noreferrer">
                      Ver acta
                    </Link>
                  ) : data.minutesUrl ? (
                    'Enlace no válido'
                  ) : (
                    'Sin cargar'
                  )
                }
              />
              <Field label="Cargada por" value={data.createdBy?.name ?? '—'} />
              <Field
                label="Firmada"
                value={
                  data.signedAt
                    ? `${new Date(data.signedAt).toLocaleDateString('es-AR')} · ${data.signedBy?.name ?? '—'}`
                    : 'No'
                }
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Field
                label="Consideraciones"
                value={
                  <Box component="span" sx={{ whiteSpace: 'pre-line' }}>
                    {data.considerations || 'Sin consideraciones.'}
                  </Box>
                }
              />
            </Box>
          </ContentCard>

          {/* Integrantes */}
          <ContentCard>
            <Typography variant="h6" sx={{ px: 3, pt: 3, pb: 1.5 }}>
              Integrantes ({present.length} presentes de {data.members.length} convocados)
            </Typography>
            {data.members.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', px: 3, pb: 3 }}>
                No se registraron integrantes.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={headSx}>
                    <TableRow>
                      <TableCell>Integrante</TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell align="center">Asistencia</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...present, ...absent].map((member) => (
                      <TableRow key={member.userId} hover>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {member.name}
                        </TableCell>
                        <TableCell>
                          {memberRoleLabel(member.roleInMeeting ?? member.role)}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ color: member.present ? 'text.primary' : 'text.secondary' }}
                        >
                          {member.present ? 'Presente' : 'Ausente'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </ContentCard>

          {/* Alumnos tratados, con acceso a la ficha y al PATE */}
          <ContentCard>
            <Typography variant="h6" sx={{ px: 3, pt: 3, pb: 1.5 }}>
              Alumnos tratados ({data.students.length})
            </Typography>
            {data.students.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', px: 3, pb: 3 }}>
                No se registraron alumnos tratados.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small" sx={{ minWidth: 700 }}>
                  <TableHead sx={headSx}>
                    <TableRow>
                      <TableCell>Alumno</TableCell>
                      <TableCell>Curso</TableCell>
                      <TableCell align="center">MPAA</TableCell>
                      <TableCell>Consideraciones</TableCell>
                      <TableCell>PATE</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.students.map((student) => (
                      <TableRow key={student.studentId} hover>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {student.lastName}, {student.firstName}
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', color: 'text.secondary' }}
                          >
                            DNI {student.dni}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {student.section
                            ? `${student.section.grade}° ${student.section.division} · ${SHIFT_LABELS[student.section.shift]}`
                            : '—'}
                        </TableCell>
                        <TableCell align="center">{student.pendingSubjectsCount}</TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-line', maxWidth: 280 }}>
                          {student.notes || '—'}
                        </TableCell>
                        <TableCell>
                          {student.pate ? pateStatusLabel(student.pate.status) : 'Sin PATE'}
                        </TableCell>
                        <TableCell align="right">
                          {/* El PATE todavía no tiene pantalla propia (CRM-078): se ve desde la ficha */}
                          <Button
                            size="small"
                            color="inherit"
                            onClick={() => navigate(`/students/${student.studentId}`)}
                          >
                            {student.pate ? 'Ver ficha y PATE' : 'Ver ficha'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </ContentCard>
        </Stack>

        {/* Confirmación para marcar como firmada: después ya no se puede editar */}
        <Dialog
          open={confirmSign}
          onClose={() => !signing && setConfirmSign(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>¿Marcar la reunión como firmada?</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              Después ya no se va a poder editar. Hace falta tener cargado el enlace al acta
              firmada.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button color="inherit" disabled={signing} onClick={() => setConfirmSign(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              disableElevation
              disabled={signing}
              onClick={() => void handleSign()}
            >
              {signing ? 'Guardando...' : 'Marcar como firmada'}
            </Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    </MainLayout>
  )
}

export default EdteMeetingDetailPage
