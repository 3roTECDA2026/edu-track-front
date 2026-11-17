import { Box, Button, MenuItem, TextField } from '@mui/material'

import {
  EVENT_TYPE_CONFIG,
  EVENT_TYPES,
} from '@/components/interventions/interventionTimelineConfig'
import type { InterventionEventType, InterventionFilters } from '@/services/interventions.service'

interface InterventionTimelineFiltersProps {
  filters: InterventionFilters
  onChange: (filters: InterventionFilters) => void
  error?: string | null
}

// Filtros de la línea de tiempo (CRM-088, criterio 3): tipo de evento y rango de fechas.
// Los mismos filtros se usan para exportar el PDF.
export const InterventionTimelineFilters = ({
  filters,
  onChange,
  error,
}: InterventionTimelineFiltersProps) => {
  const hasFilters = Boolean(filters.eventType || filters.from || filters.to)

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 2 }}>
      <TextField
        select
        size="small"
        label="Tipo de evento"
        value={filters.eventType ?? ''}
        onChange={(event) =>
          onChange({
            ...filters,
            eventType: (event.target.value || undefined) as InterventionEventType | undefined,
          })
        }
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">Todos</MenuItem>
        {EVENT_TYPES.map((type) => (
          <MenuItem key={type} value={type}>
            {EVENT_TYPE_CONFIG[type].label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        type="date"
        size="small"
        label="Desde"
        value={filters.from ?? ''}
        onChange={(event) => onChange({ ...filters, from: event.target.value || undefined })}
        error={Boolean(error)}
        helperText={error ?? undefined}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <TextField
        type="date"
        size="small"
        label="Hasta"
        value={filters.to ?? ''}
        onChange={(event) => onChange({ ...filters, to: event.target.value || undefined })}
        error={Boolean(error)}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      {hasFilters && (
        <Button color="inherit" onClick={() => onChange({})} sx={{ textTransform: 'none' }}>
          Limpiar filtros
        </Button>
      )}
    </Box>
  )
}

export default InterventionTimelineFilters
