import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import PageHeader from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { useEdteMembers } from '@/hooks/useEdteMembers'
import { searchUsers, type UserOption } from '@/services/users.service'
import { createEdteMember, updateEdteMember, deactivateEdteMember, type EdteMember } from '@/services/edteMembers.service'

export default function EdteMembersPage() {
  const { members, loading, error } = useEdteMembers()
  const [local, setLocal] = useState<EdteMember[]>([])
  useEffect(() => setLocal(members), [members])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EdteMember | null>(null)
  const [role, setRole] = useState('')
  const [active, setActive] = useState(true)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserOption[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    searchUsers(query).then((r) => setResults(Array.isArray(r) ? r : [])).catch(() => setResults([]))
  }, [query])

  const reset = () => { setEditing(null); setRole(''); setActive(true); setQuery(''); setSelectedUserId(''); setResults([]) }
  const openNew = () => { reset(); setOpen(true) }
  const openEdit = (m: EdteMember) => { setEditing(m); setRole(m.roleInTeam); setActive(m.active); setOpen(true) }

  const save = async () => {
    try {
      if (editing) {
        const u = await updateEdteMember(editing.id, { roleInTeam: role, active })
        setLocal((p) => p.map((m) => (m.id === u.id ? u : m)))
        setMsg('Integrante actualizado')
      } else {
        const u = await createEdteMember({ userId: selectedUserId, roleInTeam: role, active })
        setLocal((p) => [u, ...p])
        setMsg('Integrante creado')
      }
      setOpen(false); reset()
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Error') }
  }

  const deactivate = async (id: string) => {
    try {
      await deactivateEdteMember(id)
      setLocal((p) => p.map((m) => (m.id === id ? { ...m, active: false } : m)))
      setMsg('Integrante dado de baja')
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Error') }
    setConfirmId(null)
  }

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 1 }}>
        <PageHeader title="Integrantes del EDTE" subtitle="Gestión de integrantes." breadcrumbs={[{ label: 'Inicio', href: '/home' }, { label: 'EDTE' }, { label: 'Integrantes' }]} />
        {msg && <Typography color="primary" sx={{ mb: 1 }}>{msg}</Typography>}
        {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" onClick={openNew}>Nuevo integrante</Button>
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
              {local.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.user ? `${m.user.lastName ?? ''}, ${m.user.firstName ?? ''}` : m.userId}</TableCell>
                  <TableCell>{m.roleInTeam}</TableCell>
                  <TableCell>{m.active ? 'Activo' : 'Inactivo'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEdit(m)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setConfirmId(m.id)} disabled={!m.active}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {local.length === 0 && !loading && (
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
      <Dialog open={open} onClose={() => { setOpen(false); reset() }}>
        <DialogTitle>{editing ? 'Editar integrante' : 'Nuevo integrante'}</DialogTitle>
        <DialogContent>
          {!editing && (
            <>
              <TextField label="Buscar usuario" value={query} onChange={(e) => setQuery(e.target.value)} fullWidth sx={{ mt: 1 }} />
              <Select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} fullWidth sx={{ mt: 1 }} displayEmpty>
                <MenuItem value="" disabled>Seleccionar usuario</MenuItem>
                {(Array.isArray(results) ? results : []).map((u) => (
                  <MenuItem key={u.id} value={u.id}>{(u.lastName ?? '') + ', ' + (u.firstName ?? '')}</MenuItem>
                ))}
              </Select>
            </>
          )}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Rol</InputLabel>
            <Select value={role} label="Rol" onChange={(e) => setRole(e.target.value)}>
              <MenuItem value="DOCENTE">Docente</MenuItem>
              <MenuItem value="PRECEPTOR">Preceptor</MenuItem>
              <MenuItem value="ORIENTADOR">Orientador</MenuItem>
              <MenuItem value="DIRECTIVO">Directivo</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />} label="Activo" sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); reset() }}>Cancelar</Button>
          <Button variant="contained" onClick={save} disabled={!role || (!editing && !selectedUserId)}>Guardar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!confirmId} onClose={() => setConfirmId(null)}>
        <DialogTitle>Confirmar baja</DialogTitle>
        <DialogContent>
          <Typography>¿Dar de baja a este integrante?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmId(null)}>Cancelar</Button>
          <Button color="error" onClick={() => confirmId && deactivate(confirmId)}>Confirmar</Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  )
}
