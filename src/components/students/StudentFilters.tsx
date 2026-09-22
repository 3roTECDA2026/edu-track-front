import { Box, Button, InputAdornment, MenuItem, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import type { StatusFilter } from '@/services/students.service';
import {
  DIVISION_OPTIONS,
  GRADE_OPTIONS,
  SHIFT_LABELS,
  STATUS_FILTER_OPTIONS,
} from '@/components/students/studentLabels';

export interface StudentFiltersState {
  search: string;
  grade: string;
  division: string;
  shift: string;
  status: StatusFilter;
}

interface StudentFiltersProps {
  filters: StudentFiltersState;
  hasActiveFilters: boolean;
  onChange: (changes: Partial<StudentFiltersState>) => void;
  onClear: () => void;
}

// Shows the "Todos..." option text when the value is empty.
const selectSlotProps = { select: { displayEmpty: true } };
const selectSx = { minWidth: 160, '& .MuiSelect-select': { fontSize: '0.875rem' } };

export const StudentFilters = ({ filters, hasActiveFilters, onChange, onClear }: StudentFiltersProps) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', p: 2 }}>
      <TextField
        placeholder="Buscar por nombre, apellido o DNI..."
        size="small"
        value={filters.search}
        onChange={(event) => onChange({ search: event.target.value })}
        sx={{ flex: '1 1 280px' }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        select
        size="small"
        value={filters.grade}
        onChange={(event) => onChange({ grade: event.target.value })}
        sx={selectSx}
        slotProps={selectSlotProps}
      >
        <MenuItem value="">Todos los años</MenuItem>
        {GRADE_OPTIONS.map((grade) => (
          <MenuItem key={grade} value={String(grade)}>
            {grade}° Año
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        value={filters.division}
        onChange={(event) => onChange({ division: event.target.value })}
        sx={selectSx}
        slotProps={selectSlotProps}
      >
        <MenuItem value="">Todas las secciones</MenuItem>
        {DIVISION_OPTIONS.map((division) => (
          <MenuItem key={division} value={division}>
            Sección {division}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        value={filters.shift}
        onChange={(event) => onChange({ shift: event.target.value })}
        sx={selectSx}
        slotProps={selectSlotProps}
      >
        <MenuItem value="">Todos los turnos</MenuItem>
        {Object.entries(SHIFT_LABELS).map(([value, label]) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        value={filters.status}
        onChange={(event) => onChange({ status: event.target.value as StatusFilter })}
        sx={selectSx}
      >
        {STATUS_FILTER_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      {hasActiveFilters && (
        <Button
          variant="text"
          color="inherit"
          size="small"
          startIcon={<FilterAltOffIcon />}
          onClick={onClear}
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          Limpiar
        </Button>
      )}
    </Box>
  );
};

export default StudentFilters;
