import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import MainLayout from '@/components/layout/MainLayout'
import PageHeader from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'

export default function EdteMembersPage() {
  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 1 }}>
        <PageHeader title="Integrantes del EDTE" subtitle="Gestión de integrantes." breadcrumbs={[{ label: 'Inicio', href: '/home' }, { label: 'EDTE' }, { label: 'Integrantes' }]} />
        <ContentCard>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2">Sin integrantes cargados.</Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ContentCard>
      </Box>
    </MainLayout>
  )
}
