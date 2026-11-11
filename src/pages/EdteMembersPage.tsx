import { Box, Button, Dialog, DialogContent, DialogTitle, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import MainLayout from '@/components/layout/MainLayout'
import PageHeader from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { useEdteMembers } from '@/hooks/useEdteMembers'
import { useState } from 'react'

export default function EdteMembersPage() {
  const { members, loading } = useEdteMembers()
  const [open, setOpen] = useState(false)
  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 1 }}>
        <PageHeader title="Integrantes del EDTE" subtitle="Gestión de integrantes." breadcrumbs={[{ label: 'Inicio', href: '/home' }, { label: 'EDTE' }, { label: 'Integrantes' }]} />
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" onClick={() => setOpen(true)}>Nuevo integrante</Button>
        </Box>
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
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.user ? `${m.user.lastName ?? ''}, ${m.user.firstName ?? ''}` : m.userId}</TableCell>
                  <TableCell>{m.roleInTeam}</TableCell>
                  <TableCell>{m.active ? 'Activo' : 'Inactivo'}</TableCell>
                  <TableCell>—</TableCell>
                </TableRow>
              ))}
              {members.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2">Sin integrantes cargados.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ContentCard>
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Nuevo integrante</DialogTitle>
        <DialogContent />
      </Dialog>
    </MainLayout>
  )
}
