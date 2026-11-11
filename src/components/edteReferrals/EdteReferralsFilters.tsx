import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import SearchIcon from '@mui/icons-material/Search'
import { Box, Button, InputAdornment, MenuItem, TextField } from '@mui/material'

import type { ReferralFilters, filterOptions } from '@/components/edteReferrals/referralRows'
import { SHIFT_LABELS } from '@/components/students/studentLabels'

interface EdteReferralsFiltersProps {
  filters: ReferralFilters
  options: ReturnType<typeof filterOptions>
  onChange: (changes: Partial<ReferralFilters>) => void
  onClear: () => void
}

// Muestra el texto "Todos..." cuando el valor está vacío (mismo estilo que StudentFilters)
const selectSlotProps = { select: { displayEmpty: true } }
const selectSx = { minWidth: 160, '& .MuiSelect-select': { fontSize: '0.875rem' } }

// Filtros por año, sección y turno, y buscador por nombre o DNI (CRM-074, criterio 2)
export function EdteReferralsFilters({
  filters,
  options,
  onChange,
  onClear,
}: EdteReferralsFiltersProps) {
  const hasActiveFilters = Object.values(filters).some((value) => value !== '')

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', p: 2 }}>
      <TextField
        placeholder="Buscar por nombre, apellido o DNI..."
        size="small"
        value={filters.search}
        onChange={(event) => onChange({ search: event.target.value })}
        sx={{ flex: '1 1 280px' }}
        slotProps={{
          htmlInput: { 'aria-label': 'Buscar por nombre, apellido o DNI' },
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
        slotProps={{ ...selectSlotProps, htmlInput: { 'aria-label': 'Año' } }}
      >
        <MenuItem value="">Todos los años</MenuItem>
        {options.grades.map((grade) => (
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
        slotProps={{ ...selectSlotProps, htmlInput: { 'aria-label': 'Sección' } }}
      >
        <MenuItem value="">Todas las secciones</MenuItem>
        {options.divisions.map((division) => (
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
        slotProps={{ ...selectSlotProps, htmlInput: { 'aria-label': 'Turno' } }}
      >
        <MenuItem value="">Todos los turnos</MenuItem>
        {options.shifts.map((shift) => (
          <MenuItem key={shift} value={shift}>
            {SHIFT_LABELS[shift]}
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
  )
}
