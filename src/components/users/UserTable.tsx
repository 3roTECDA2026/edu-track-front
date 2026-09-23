import {
  Chip,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { UserListItem } from '@/services/users.service';
import { ROLE_LABELS } from './userLabels';
import { UserStatusChip } from './UserStatusChip';
import { UsersEmptyState } from './UsersEmptyState';

interface UsersTableProps {
  users: UserListItem[];
  total: number;
  loading: boolean;
  page: number; // base 0 (MUI)
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onEdit: (user: UserListItem) => void;
  onToggleActive: (user: UserListItem) => void;
}

const headSx = { fontWeight: 700, fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' } as const;

export const UsersTable = ({
  users,
  total,
  loading,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onToggleActive,
}: UsersTableProps) => {
  return (
    <>
      <TableContainer>
        {loading && <LinearProgress sx={{ height: 2 }} />}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={headSx}>Nombre</TableCell>
              <TableCell sx={headSx}>Email</TableCell>
              <TableCell sx={headSx}>Rol</TableCell>
              <TableCell sx={headSx}>Estado</TableCell>
              <TableCell sx={headSx} align="right">
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && users.length === 0 && <UsersEmptyState colSpan={5} />}
            {users.map((u) => (
              <TableRow key={u.id} hover sx={{ opacity: u.active ? 1 : 0.7 }}>
                <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{u.email}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={ROLE_LABELS[u.role] ?? u.role}
                    sx={{ borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell>
                  <UserStatusChip active={u.active} />
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => onEdit(u)} aria-label={`Editar ${u.name}`}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={u.active ? 'Suspender' : 'Reactivar'}>
                    <IconButton
                      size="small"
                      color={u.active ? 'error' : 'success'}
                      onClick={() => onToggleActive(u)}
                      aria-label={`${u.active ? 'Suspender' : 'Reactivar'} ${u.name}`}
                    >
                      {u.active ? (
                        <BlockIcon fontSize="small" />
                      ) : (
                        <CheckCircleOutlineIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        onPageChange={(_, p) => onPageChange(p)}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        labelRowsPerPage="Filas por página"
        labelDisplayedRows={({ from, to, count }) => `Mostrando ${from}–${to} de ${count} usuarios`}
      />
    </>
  );
};