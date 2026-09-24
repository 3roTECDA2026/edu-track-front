import { TableCell, TableRow, Typography } from '@mui/material';

interface UsersEmptyStateProps {
  colSpan: number;
}

export const UsersEmptyState = ({ colSpan }: UsersEmptyStateProps) => {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 6 }}>
        <Typography color="text.secondary">
          No hay usuarios que coincidan con la búsqueda.
        </Typography>
      </TableCell>
    </TableRow>
  );
};