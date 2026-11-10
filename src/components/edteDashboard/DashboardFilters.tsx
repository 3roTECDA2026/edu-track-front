import { Box, MenuItem, TextField } from '@mui/material'

import { SHIFT_LABELS } from '@/components/students/studentLabels'
import { GRADE_FILTER_OPTIONS } from '@/components/edteDashboard/dashboardLabels'
import { ASSESSMENT_CONFIG } from '@/components/studentProfile/profileLabels'
import type { DashboardFilters as Filters } from '@/services/edteDashboard.service'
import type { PreliminaryAssessment } from '@/services/studentProfile.service'
import type { ClassSectionOption } from '@/services/students.service'

interface DashboardFiltersProps {
  filters: Filters
  sections: ClassSectionOption[]
  onChange: (filters: Filters) => void
}

// Filtros del dashboard (CRM-077, criterio 3): valoración, año y sección. Cualquier cambio
// actualiza tarjetas y listado, porque los dos salen del mismo pedido.
export const DashboardFilters = ({ filters, sections, onChange }: DashboardFiltersProps) => {
  // Las secciones dependen del año elegido
  const sectionOptions = sections.filter(
    (section) => filters.grade === undefined || section.grade === filters.grade
  )

  return (
    <Box
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 2, borderBottom: '1px solid #e5e7eb' }}
    >
      <TextField
        select
        size="small"
        label="Valoración"
        value={filters.assessment ?? ''}
        onChange={(event) =>
          onChange({
            ...filters,
            assessment: (event.target.value || undefined) as PreliminaryAssessment | undefined,
          })
        }
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">Todas</MenuItem>
        {(['TEA', 'TEP', 'TED'] as const).map((value) => (
          <MenuItem key={value} value={value}>
            {value} · {ASSESSMENT_CONFIG[value].description}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Año"
        value={filters.grade ?? ''}
        onChange={(event) =>
          // Al cambiar el año, la sección elegida deja de servir
          onChange({
            ...filters,
            grade: event.target.value === '' ? undefined : Number(event.target.value),
            classSectionId: undefined,
          })
        }
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="">Todos</MenuItem>
        {GRADE_FILTER_OPTIONS.map((grade) => (
          <MenuItem key={grade} value={grade}>
            {grade}° año
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Sección"
        value={filters.classSectionId ?? ''}
        onChange={(event) =>
          onChange({ ...filters, classSectionId: event.target.value || undefined })
        }
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">Todas</MenuItem>
        {sectionOptions.map((section) => (
          <MenuItem key={section.id} value={section.id}>
            {section.grade}° {section.division} · {SHIFT_LABELS[section.shift]}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  )
}

export default DashboardFilters
