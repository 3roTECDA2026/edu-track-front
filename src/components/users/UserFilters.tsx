import { InputAdornment, MenuItem, Stack, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { ROLES, type Role } from '@/services/users.service';
import { ROLE_LABELS } from './userLabels';

interface UserFiltersProps {
  search: string;
  role: Role | '';
  active: 'true' | 'false' | '';
  onSearchChange: (value: string) => void;
  onRoleChange: (value: Role | '') => void;
  onActiveChange: (value: 'true' | 'false' | '') => void;
}

export const UserFilters = ({
  search,
  role,
  active,
  onSearchChange,
  onRoleChange,
  onActiveChange,
}: UserFiltersProps) => {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2 }}>
      <TextField
        size="small"
        fullWidth
        placeholder="Buscar por nombre o email..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      <TextField
        select
        size="small"
        label="Rol"
        value={role}
        sx={{ minWidth: 180 }}
        onChange={(e) => onRoleChange(e.target.value as Role | '')}
      >
        <MenuItem value="">Todos los roles</MenuItem>
        {ROLES.map((r) => (
          <MenuItem key={r} value={r}>
            {ROLE_LABELS[r]}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Estado"
        value={active}
        sx={{ minWidth: 180 }}
        onChange={(e) => onActiveChange(e.target.value as 'true' | 'false' | '')}
      >
        <MenuItem value="">Todos los estados</MenuItem>
        <MenuItem value="true">Activo</MenuItem>
        <MenuItem value="false">Suspendido</MenuItem>
      </TextField>
    </Stack>
  );
};