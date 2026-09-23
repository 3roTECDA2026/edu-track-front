import { useState } from 'react';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNotify } from '@/components/layout/NotificationProvider';
import { SuspendUserDialog } from '@/components/users/SuspendUserDialog';
import { UserFilters } from '@/components/users/UserFilters';
import { getFullName } from '@/components/users/userLabels';
import { UserFormDialog } from '@/components/users/UserFormDialog';
import { UsersTable } from '@/components/users/UsersTable';
import { useUsers } from '@/hooks/useUsers';
import { activateUser, suspendUser, type UserListItem } from '@/services/users.service';

const UsersPage = () => {
  const notify = useNotify();
  const q = useUsers();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [toToggle, setToToggle] = useState<UserListItem | null>(null);
  const [toggling, setToggling] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (user: UserListItem) => {
    setEditing(user);
    setFormOpen(true);
  };

  const confirmToggle = async () => {
    if (!toToggle) return;
    setToggling(true);
    try {
      if (toToggle.active) {
        await suspendUser(toToggle.id);
        notify.success(`${getFullName(toToggle)} fue suspendido`);
      } else {
        await activateUser(toToggle.id);
        notify.success(`${getFullName(toToggle)} fue reactivado`);
      }
      setToToggle(null);
      q.reload();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'No se pudo completar la operación');
    } finally {
      setToggling(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f4f4f4', minHeight: '100%' }}>
      <Stack
        direction="row"
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Usuarios del sistema
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administrá los accesos y roles de los usuarios
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#000' }, textTransform: 'none' }}
        >
          Nuevo usuario
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <UserFilters
          search={q.search}
          role={q.role}
          active={q.active}
          onSearchChange={q.setSearch}
          onRoleChange={q.setRole}
          onActiveChange={q.setActive}
        />

        {q.error && (
          <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
            {q.error}
          </Alert>
        )}

        <UsersTable
          users={q.users}
          total={q.total}
          loading={q.loading}
          page={q.page}
          rowsPerPage={q.rowsPerPage}
          onPageChange={q.setPage}
          onRowsPerPageChange={q.setRowsPerPage}
          onEdit={openEdit}
          onToggleActive={setToToggle}
        />
      </Paper>

      <UserFormDialog
        open={formOpen}
        user={editing}
        onClose={() => setFormOpen(false)}
        onSaved={q.reload}
      />

      <SuspendUserDialog
        open={!!toToggle}
        user={toToggle}
        loading={toggling}
        onConfirm={confirmToggle}
        onClose={() => setToToggle(null)}
      />
    </Box>
  );
};

export default UsersPage;