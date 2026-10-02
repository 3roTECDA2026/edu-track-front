import { Box, Button, Typography } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import PeopleOutlineIcon from '@mui/icons-material/People';

interface StudentsEmptyStateProps {
  hasActiveFilters: boolean;
  onClear: () => void;
}

export const StudentsEmptyState = ({ hasActiveFilters, onClear }: StudentsEmptyStateProps) => {
  const Icon = hasActiveFilters ? SearchOffIcon : PeopleOutlineIcon;

  return (
    <Box sx={{ py: 8, px: 2, textAlign: 'center', borderTop: '1px solid #e0e0e0' }}>
      <Box
        sx={{
          width: 88,
          height: 88,
          mx: 'auto',
          mb: 2,
          borderRadius: '50%',
          backgroundColor: '#f1f3f4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon sx={{ fontSize: 44, color: '#5f6368' }} />
      </Box>

      <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 0.5 }}>
        {hasActiveFilters ? 'No encontramos estudiantes' : 'Todavía no hay estudiantes cargados'}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: hasActiveFilters ? 3 : 0 }}>
        {hasActiveFilters
          ? 'Probá con otra búsqueda o cambiá los filtros.'
          : 'Cuando se registren estudiantes, van a aparecer en este listado.'}
      </Typography>

      {hasActiveFilters && (
        <Button variant="outlined" color="inherit" size="small" onClick={onClear} sx={{ textTransform: 'none' }}>
          Limpiar filtros
        </Button>
      )}
    </Box>
  );
};

export default StudentsEmptyState;
