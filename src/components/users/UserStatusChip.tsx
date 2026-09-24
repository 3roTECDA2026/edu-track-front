import { Chip } from '@mui/material';

interface UserStatusChipProps {
  active: boolean;
}

export const UserStatusChip = ({ active }: UserStatusChipProps) => {
  return (
    <Chip
      size="small"
      variant="outlined"
      label={active ? 'Activo' : 'Suspendido'}
      color={active ? 'success' : 'error'}
      sx={{ borderRadius: 1, fontWeight: 600 }}
    />
  );
};