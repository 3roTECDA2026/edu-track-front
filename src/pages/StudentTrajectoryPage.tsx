import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useParams } from 'react-router-dom'

import MainLayout from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import {
  getStudent,
  getStudentTrajectory,
  type StudentDetail,
  type StudentTrajectoryRecord,
} from '@/services/students.service'

const formatDate = (date: string | null) => {
  if (!date) return 'Actualidad'
  return new Date(date).toLocaleDateString('es-AR')
}

const formatShift = (shift: StudentTrajectoryRecord['shift']) => {
  switch (shift) {
    case 'MORNING':
      return 'Mañana'
    case 'AFTERNOON':
      return 'Tarde'
    case 'EVENING':
      return 'Noche'
    case 'EXTRA_TIME':
      return 'Extra'
    default:
      return shift
  }
}

const StudentTrajectoryPage = () => {
  const { id } = useParams<{ id: string }>()

  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [trajectory, setTrajectory] = useState<StudentTrajectoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('No se indicó el estudiante.')
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    void Promise.all([
      getStudent(id, controller.signal),
      getStudentTrajectory(id, controller.signal),
    ])
      .then(([studentData, trajectoryData]) => {
        if (controller.signal.aborted) return
        setStudent(studentData)
        setTrajectory(trajectoryData)
        setError(null)
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo cargar la trayectoria del estudiante.'
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [id])

  const studentName = student ? `${student.lastName}, ${student.firstName}` : 'Estudiante'

  return (
    <MainLayout>
      <PageContainer>
        {/* El breadcrumb reemplaza al botón "Volver": lleva al listado o a la ficha */}
        <PageHeader
          title="Trayectoria escolar"
          subtitle="Cursos, secciones y turnos por los que pasó el estudiante en cada ciclo lectivo."
          breadcrumbs={[
            { label: 'Inicio', href: '/home' },
            { label: 'Estudiantes', href: '/students' },
            { label: studentName, href: id ? `/students/${id}` : undefined },
            { label: 'Trayectoria' },
          ]}
        />

        {loading && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', py: 4, justifyContent: 'center' }}
          >
            <CircularProgress size={20} />
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Cargando trayectoria...
            </Typography>
          </Stack>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && student && (
          <Stack spacing={3}>
            {/* Datos del estudiante */}
            <ContentCard sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: '#111827' }}>
                {studentName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                Legajo {student.recordNumber} · DNI {student.dni}
              </Typography>
              {student.currentSection && (
                <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                  Curso actual: {student.currentSection.grade}° {student.currentSection.division} ·
                  Turno {formatShift(student.currentSection.shift)}
                </Typography>
              )}
            </ContentCard>

            {/* Recorrido por ciclo lectivo */}
            <ContentCard>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #e5e7eb' }}>
                <Typography variant="h6" sx={{ color: '#111827' }}>
                  Recorrido por ciclo lectivo
                </Typography>
              </Box>

              {trajectory.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#6b7280', textAlign: 'center', py: 4 }}>
                  Todavía no hay registros de trayectoria para este estudiante.
                </Typography>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 800 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Ciclo lectivo</TableCell>
                        <TableCell>Curso</TableCell>
                        <TableCell>Turno</TableCell>
                        <TableCell>Desde</TableCell>
                        <TableCell>Hasta</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Motivo de salida</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trajectory.map((record) => (
                        <TableRow key={record.id} hover>
                          <TableCell sx={{ fontWeight: 600, color: '#111827' }}>
                            {record.year}
                          </TableCell>
                          <TableCell sx={{ color: '#374151' }}>{record.section}</TableCell>
                          <TableCell sx={{ color: '#374151' }}>
                            {formatShift(record.shift)}
                          </TableCell>
                          <TableCell sx={{ color: '#374151' }}>
                            {formatDate(record.startDate)}
                          </TableCell>
                          <TableCell sx={{ color: '#374151' }}>
                            {formatDate(record.endDate)}
                          </TableCell>
                          <TableCell>
                            {record.endDate ? (
                              <Chip label="Finalizado" size="small" variant="outlined" />
                            ) : (
                              <Chip label="Actual" size="small" color="success" />
                            )}
                          </TableCell>
                          <TableCell sx={{ color: '#374151' }}>
                            {record.leaveReason || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </ContentCard>
          </Stack>
        )}
      </PageContainer>
    </MainLayout>
  )
}

export default StudentTrajectoryPage
