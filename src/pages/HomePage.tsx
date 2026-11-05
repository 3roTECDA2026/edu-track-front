import React, { useEffect, useState } from 'react'
import { Box, Typography, Grid, Card, CardContent, Stack, CircularProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import MainLayout from '@/components/layout/MainLayout'
import { fetchApi } from '@/services/api'
import ActiveScheduleCards from '@/components/ActiveScheduleCards'
import StudentAlertsModule from '@/components/StudentAlertsModule'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { AddButton } from '@/components/common/AddButton'

interface StudentsResponse {
  items?: unknown[]
  total?: number
}

const DEFAULT_ACTIVE_COURSES = 7

// Tarjetas del panel: el borde y las esquinas salen del theme (MuiPaper outlined)
const cardSx = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
} as const

export const HomePage: React.FC = () => {
  const navigate = useNavigate()

  const [totalStudents, setTotalStudents] = useState<number | null>(null)
  const [activeCourses, setActiveCourses] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    const fetchDashboardStats = async () => {
      try {
        setLoading(true)
        const studentsRes = await fetchApi<StudentsResponse>(
          '/api/students?page=1&pageSize=1'
        ).catch(() => null)

        if (!isMounted) return

        if (studentsRes) {
          const count =
            typeof studentsRes.total === 'number'
              ? studentsRes.total
              : (studentsRes.items?.length ?? 0)
          setTotalStudents(count)
        } else {
          setTotalStudents(0)
        }

        setActiveCourses(DEFAULT_ACTIVE_COURSES)
      } catch (error) {
        console.error('Error al cargar métricas del dashboard:', error)
        if (isMounted) {
          setTotalStudents(0)
          setActiveCourses(DEFAULT_ACTIVE_COURSES)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void fetchDashboardStats()

    return () => {
      isMounted = false
    }
  }, [])

  const goTo = (path: string) => navigate(path)

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Bienvenido a NOTAR"
          subtitle="Gestión educativa simplificada para la Escuela Normal."
          breadcrumbs={[{ label: 'Inicio' }]}
        />

        <ActiveScheduleCards />

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={cardSx}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Estudiantes
                </Typography>
                <Typography variant="h3" sx={{ color: '#111827', fontWeight: 800, my: 1 }}>
                  {loading ? (
                    <CircularProgress size={30} sx={{ color: '#111827' }} />
                  ) : (
                    (totalStudents ?? 0)
                  )}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
                  Total matriculados
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <AddButton label="Ver listado" onClick={() => goTo('/students')} fullWidth />
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={cardSx}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Cursos registrados
                </Typography>
                <Typography variant="h3" sx={{ color: '#111827', fontWeight: 800, my: 1 }}>
                  {loading ? (
                    <CircularProgress size={30} sx={{ color: '#111827' }} />
                  ) : (
                    (activeCourses ?? 0)
                  )}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
                  Secciones y cursos institucionales
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <AddButton label="Gestionar cursos" onClick={() => goTo('/courses')} fullWidth />
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Acciones rápidas
                </Typography>
                <Stack spacing={1.5}>
                  <AddButton
                    label="Registrar estudiante"
                    onClick={() => goTo('/students')}
                    fullWidth
                  />
                  <AddButton
                    label="Reporte de asistencias"
                    onClick={() => goTo('/attendance')}
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <StudentAlertsModule />
      </PageContainer>
    </MainLayout>
  )
}

export default HomePage
