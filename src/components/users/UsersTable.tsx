import {
  Chip,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { EditButton } from '@/components/common/EditButton';
import { StandardTablePagination } from '@/components/common/StandardTablePagination';
import type { UserListItem } from '@/services/users.service';
import { ROLE_LABELS, getFullName } from '@/components/users/userLabels';
import { UserStatusChip } from '@/components/users/UserStatusChip';
import { UsersEmptyState } from '@/components/users/UsersEmptyState';

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
              <TableCell sx={headSx}>Usuario</TableCell>
              <TableCell sx={headSx}>Email</TableCell>
              <TableCell sx={headSx}>Rol</TableCell>
              <TableCell sx={headSx}>Estado</TableCell>
              <TableCell sx={headSx} align="right">
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && users.length === 0 && <UsersEmptyState colSpan={6} />}
            {users.map((u) => (
              <TableRow key={u.id} hover sx={{ opacity: u.active ? 1 : 0.7 }}>
                <TableCell sx={{ fontWeight: 600 }}>{getFullName(u)}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{u.username}</TableCell>
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
                  <EditButton onClick={() => onEdit(u)} aria-label={`Editar ${getFullName(u)}`} />
                  <Tooltip title={u.active ? 'Suspender' : 'Reactivar'}>
                    <IconButton
                      size="small"
                      color={u.active ? 'error' : 'success'}
                      onClick={() => onToggleActive(u)}
                      aria-label={`${u.active ? 'Suspender' : 'Reactivar'} ${getFullName(u)}`}
                    >
                      {u.active ? (
                        <BlockIcon fontSize="small" />
                      ) : (
                        <CheckCircleOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <StandardTablePagination
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        itemLabel="usuarios"
      />
    </>
  );
};