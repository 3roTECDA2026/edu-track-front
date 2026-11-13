import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

import MainLayout from '@/components/layout/MainLayout'
import { useNotify } from '@/components/layout/NotificationProvider'
import { AddButton } from '@/components/common/AddButton'
import { ContentCard } from '@/components/common/ContentCard'
import { EditButton } from '@/components/common/EditButton'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useEdteMembers } from '@/hooks/useEdteMembers'
import {
  createEdteTeamMember,
  deactivateEdteTeamMember,
  listEdteStaffOptions,
  updateEdteTeamMember,
  type EdteRole,
  type EdteShift,
  type EdteStaffOption,
  type EdteTeamMember,
} from '@/services/edteMembers.service'

const SHIFT_LABELS: Record<EdteShift, string> = {
  MORNING: 'Mañana',
  AFTERNOON: 'Tarde',
  EVENING: 'Vespertino',
  EXTRA_TIME: 'Contraturno',
}

const EDTE_ROLE_LABELS: Record<EdteRole, string> = {
  TEACHER: 'Docente',
  PRECEPTOR: 'Preceptor/a',
  COUNSELOR: 'Orientador/a',
  DIRECTIVE: 'Directivo/a',
  OTHER: 'Otro referente',
}

const SHIFTS = Object.keys(SHIFT_LABELS) as EdteShift[]
const EDTE_ROLES = Object.keys(EDTE_ROLE_LABELS) as EdteRole[]

const EdteMembersPage = () => {
  const notify = useNotify()
  const { members, loading, error, reload } = useEdteMembers()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EdteTeamMember | null>(null)
  const [role, setRole] = useState<EdteRole | ''>('')
  const [shift, setShift] = useState<EdteShift | ''>('')
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<EdteStaffOption[]>([])
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [toDeactivate, setToDeactivate] = useState<EdteTeamMember | null>(null)
  const [saving, setSaving] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    listEdteStaffOptions(controller.signal)
      .then(setOptions)
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setOptionsError('No se pudieron cargar los usuarios.')
      })

    return () => controller.abort()
  }, [])

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(query.trim().toLowerCase())
  )

  const reset = () => {
    setEditing(null)
    setRole('')
    setShift('')
    setQuery('')
    setSelectedUserId('')
  }

  const closeDialog = () => {
    setOpen(false)
    reset()
  }

  const openNew = () => {
    reset()
    setOpen(true)
  }

  const openEdit = (member: EdteTeamMember) => {
    setEditing(member)
    setRole(member.edteRole)
    setShift(member.shift)
    setQuery('')
    setSelectedUserId('')
    setOpen(true)
  }

  const save = async () => {
    if (!role) return
    if (!editing && (!selectedUserId || !shift)) return

    setSaving(true)
    try {
      if (editing) {
        await updateEdteTeamMember(editing.id, { edteRole: role })
        notify.success('Integrante actualizado')
      } else {
        if (!selectedUserId || !shift) return
        await createEdteTeamMember({ userId: selectedUserId, shift, edteRole: role })
        notify.success('Integrante creado')
      }
      closeDialog()
      reload()
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'No se pudo guardar el integrante')
    } finally {
      setSaving(false)
    }
  }

  const confirmDeactivate = async () => {
    if (!toDeactivate) return

    setDeactivating(true)
    try {
      await deactivateEdteTeamMember(toDeactivate.id)
      notify.success(`${toDeactivate.user.name} fue dado de baja`)
      setToDeactivate(null)
      reload()
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'No se pudo dar de baja al integrante')
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Integrantes del EDTE"
          subtitle="Gestión de integrantes del Equipo de Definición de Trayectorias Educativas."
          breadcrumbs={[
            { label: 'Inicio', href: '/home' },
            { label: 'EDTE' },
            { label: 'Integrantes' },
          ]}
          action={<AddButton label="Nuevo integrante" onClick={openNew} />}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <ContentCard>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#fafafa' }}>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Turno</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary">
                      Cargando integrantes...
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {!loading && members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2">Sin integrantes cargados.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                members.map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>{member.user.name}</TableCell>
                    <TableCell>{SHIFT_LABELS[member.shift]}</TableCell>
                    <TableCell>{EDTE_ROLE_LABELS[member.edteRole]}</TableCell>
                    <TableCell>{member.active ? 'Activo' : 'Inactivo'}</TableCell>
                    <TableCell>
                      <EditButton
                        onClick={() => openEdit(member)}
                        disabled={!member.active}
                        label="Editar integrante"
                      />
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Dar de baja"
                        onClick={() => setToDeactivate(member)}
                        disabled={!member.active}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </ContentCard>
      </PageContainer>

      <Dialog open={open} onClose={saving ? undefined : closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Editar integrante' : 'Nuevo integrante'}
        </DialogTitle>
        <DialogContent>
          {!editing && (
            <>
              <TextField
                label="Buscar usuario"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                fullWidth
                sx={{ mt: 1 }}
              />
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="edte-user-label">Usuario</InputLabel>
                <Select
                  labelId="edte-user-label"
                  value={selectedUserId}
                  label="Usuario"
                  displayEmpty
                  onChange={(event) => setSelectedUserId(event.target.value)}
                >
                  <MenuItem value="" disabled>
                    Seleccionar usuario
                  </MenuItem>
                  {filteredOptions.map((option) => (
                    <MenuItem key={option.userId} value={option.userId}>
                      {option.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {optionsError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {optionsError}
                </Alert>
              )}
            </>
          )}

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="edte-shift-label">Turno</InputLabel>
            <Select
              labelId="edte-shift-label"
              value={shift}
              label="Turno"
              displayEmpty
              disabled={Boolean(editing)}
              onChange={(event) => setShift(event.target.value as EdteShift)}
            >
              <MenuItem value="" disabled>
                Seleccionar turno
              </MenuItem>
              {SHIFTS.map((value) => (
                <MenuItem key={value} value={value}>
                  {SHIFT_LABELS[value]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="edte-role-label">Rol</InputLabel>
            <Select
              labelId="edte-role-label"
              value={role}
              label="Rol"
              displayEmpty
              onChange={(event) => setRole(event.target.value as EdteRole)}
            >
              <MenuItem value="" disabled>
                Seleccionar rol
              </MenuItem>
              {EDTE_ROLES.map((value) => (
                <MenuItem key={value} value={value}>
                  {EDTE_ROLE_LABELS[value]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeDialog}
            disabled={saving}
            color="inherit"
            sx={{ textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={save}
            disabled={saving || !role || (!editing && (!selectedUserId || !shift))}
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!toDeactivate}
        onClose={deactivating ? undefined : () => setToDeactivate(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          ¿Dar de baja a {toDeactivate?.user.name}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            El integrante va a dejar de aparecer en el listado. Sus datos se conservan y se puede
            volver a dar de alta.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setToDeactivate(null)}
            disabled={deactivating}
            color="inherit"
            sx={{ textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmDeactivate}
            disabled={deactivating}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none' }}
          >
            {deactivating ? 'Dando de baja...' : 'Dar de baja'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  )
}

export default EdteMembersPage
