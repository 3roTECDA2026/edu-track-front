
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import type {
  Role,
  UserDisplayRole,
  UserListItem,
} from '@/services/users.service';

// =====================================================
// ETIQUETAS DE ROLES
// =====================================================

const ROLE_LABELS: Record<UserDisplayRole, string> = {
  admin: 'Administrador',
  docente: 'Docente',
  preceptor: 'Preceptor',
  ADMINISTRATOR: 'Administrador',
  SCHOOL_MANAGEMENT: 'Equipo directivo',
  EOE_DIRECTIVE: 'Equipo de orientación escolar',
  TEACHER: 'Docente',
  PRECEPTOR: 'Preceptor',
  STUDENT: 'Estudiante',
  FAMILY: 'Familia',
};

const EDITABLE_ROLES: readonly Role[] = [
  'admin',
  'docente',
  'preceptor',
];

function isEditableRole(
  role: UserDisplayRole,
): role is Role {
  return EDITABLE_ROLES.some((item) => item === role);
}

// =====================================================
// PROPIEDADES DE LA TABLA
// =====================================================

interface UsersTableProps {
  users: UserListItem[];
  total: number;
  loading: boolean;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onEdit: (user: UserListItem) => void;
  onToggleActive: (user: UserListItem) => void;
}

// =====================================================
// COMPONENTE
// =====================================================

export function UsersTable({
  users,
  total,
  loading,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onToggleActive,
}: UsersTableProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <TableContainer component={Paper} elevation={0}>
        <Table sx={{ minWidth: 750 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
              <TableCell>
                <strong>Nombre y apellido</strong>
              </TableCell>

              <TableCell>
                <strong>Correo electrónico</strong>
              </TableCell>

              <TableCell>
                <strong>Rol</strong>
              </TableCell>

              <TableCell>
                <strong>Estado</strong>
              </TableCell>

              <TableCell align="center">
                <strong>Acciones</strong>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: 4,
                    }}
                  >
                    <CircularProgress size={30} />
                  </Box>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography
                    sx={{
                      padding: 4,
                      color: 'text.secondary',
                    }}
                  >
                    No se encontraron usuarios.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: UserListItem) => {
                const fullName = [
                  user.firstName,
                  user.lastName,
                ].join(' ');

                const canEdit = isEditableRole(user.role);

                return (
                  <TableRow key={String(user.id)} hover>
                    <TableCell>
                      <Typography
                        component="span"
                        sx={{ fontWeight: 600 }}
                      >
                        {fullName}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {user.email}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={ROLE_LABELS[user.role]}
                        size="small"
                        variant="outlined"
                        color={
                          user.role === 'preceptor' ||
                          user.role === 'PRECEPTOR'
                            ? 'primary'
                            : 'default'
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={
                          user.active ? 'Activo' : 'Inactivo'
                        }
                        color={
                          user.active ? 'success' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip
                        title={
                          canEdit
                            ? 'Editar usuario'
                            : 'Este rol no está disponible para edición'
                        }
                      >
                        <span>
                          <IconButton
                            aria-label={`Editar ${fullName}`}
                            color="primary"
                            disabled={!canEdit}
                            onClick={() => onEdit(user)}
                          >
                            <EditIcon />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip
                        title={
                          user.active
                            ? 'Suspender usuario'
                            : 'Reactivar usuario'
                        }
                      >
                        <IconButton
                          aria-label={
                            user.active
                              ? `Suspender ${fullName}`
                              : `Reactivar ${fullName}`
                          }
                          color={
                            user.active ? 'error' : 'success'
                          }
                          onClick={() =>
                            onToggleActive(user)
                          }
                        >
                          {user.active ? (
                            <BlockIcon />
                          ) : (
                            <CheckCircleIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={(_, newPage) => {
          onPageChange(newPage);
        }}
        onRowsPerPageChange={(event) => {
          onRowsPerPageChange(
            Number(event.target.value),
          );
        }}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count}`
        }
      />
    </Box>
  );
}
