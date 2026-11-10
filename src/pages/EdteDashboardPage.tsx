import { useState } from 'react'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'

import MainLayout from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { ComplexTrajectoriesTable } from '@/components/edteDashboard/ComplexTrajectoriesTable'
import { DashboardFilters } from '@/components/edteDashboard/DashboardFilters'
import { IndicatorCards } from '@/components/edteDashboard/IndicatorCards'
import { DASHBOARD_TERM_LABELS } from '@/components/edteDashboard/dashboardLabels'
import { useClassSections } from '@/hooks/useClassSections'
import { useEdteDashboard } from '@/hooks/useEdteDashboard'
import type { DashboardFilters as Filters } from '@/services/edteDashboard.service'

// Dashboard del EDTE (E4-RF-05, CRM-077): indicadores de riesgo con colores de semáforo y listado
// de alumnos con trayectorias complejas, para usar en las reuniones del equipo.
export const EdteDashboardPage = () => {
  const [filters, setFilters] = useState<Filters>({})
  const { data, loading, error, forbidden, reload } = useEdteDashboard(filters)
  const { sections } = useClassSections()

  // Las secciones del ciclo activo (el dashboard trabaja con ese ciclo)
  const activeYear = data?.academicYear
  const sectionOptions = activeYear
    ? sections.filter((section) => section.year === activeYear)
    : sections

  const subtitle = data
    ? `Ciclo ${data.academicYear} · ${DASHBOARD_TERM_LABELS[data.term]}`
    : 'Indicadores de riesgo y trayectorias complejas.'

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Dashboard del EDTE"
          subtitle={subtitle}
          breadcrumbs={[{ label: 'Inicio', href: '/home' }, { label: 'Dashboard del EDTE' }]}
        />

        {forbidden ? (
          <Alert severity="warning">No tenés acceso al dashboard del EDTE.</Alert>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={reload}>
                Reintentar
              </Button>
            }
          >
            No se pudo cargar el dashboard. {error}
          </Alert>
        ) : (
          <Stack spacing={3}>
            <ContentCard>
              <DashboardFilters filters={filters} sections={sectionOptions} onChange={setFilters} />
              <Box sx={{ p: 2 }}>
                <IndicatorCards indicators={data?.indicators} loading={loading} />
                <Typography
                  variant="caption"
                  sx={{ display: 'block', mt: 2, color: 'text.secondary' }}
                >
                  Los filtros se aplican a las tarjetas y al listado.
                </Typography>
              </Box>
            </ContentCard>

            <ContentCard>
              <ComplexTrajectoriesTable students={data?.students} loading={loading} />
            </ContentCard>
          </Stack>
        )}
      </PageContainer>
    </MainLayout>
  )
}

export default EdteDashboardPage
