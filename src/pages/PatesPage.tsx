import { Box, Typography } from '@mui/material'
import MainLayout from '@/components/layout/MainLayout'
import PageHeader from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'

export default function PatesPage() {
  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 1 }}>
        <PageHeader title="PATE" subtitle="Planes de Acompañamiento" breadcrumbs={[{ label: 'Inicio', href: '/home' }, { label: 'PATE' }]} />
        <ContentCard>
          <Typography variant="body2">Listado de PATEs (pendiente de integración).</Typography>
        </ContentCard>
      </Box>
    </MainLayout>
  )
}
