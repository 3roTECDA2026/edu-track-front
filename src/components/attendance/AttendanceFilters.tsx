import React from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ContentCard from '@/components/common/ContentCard';
import AddButton from '@/components/common/AddButton';
import type { AttendanceFilters as AttendanceFilterValues } from '@/components/attendance/attendance.types';

type AttendanceFiltersProps = {
  value: AttendanceFilterValues;
  courses: string[];
  onChange: (filters: AttendanceFilterValues) => void;
  onApply: () => void;
  onReset: () => void;
};

export const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({
  value,
  courses,
  onChange,
  onApply,
  onReset,
}) => {
  const update = (field: keyof AttendanceFilterValues, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <ContentCard className="print-hidden" sx={{ mb: 3 }}>
      <Typography
        variant="subtitle1"
        sx={{
          px: 2,
          py: 1.5,
          fontWeight: 600,
          color: '#111827',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        Filtros de búsqueda
      </Typography>
      
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{
          p: 2,
          alignItems: 'center', // ✅ Se mueve dentro de sx para alineación limpia
        }}
      >
        <TextField
          label="Alumno o DNI"
          value={value.search}
          onChange={(event) => update('search', event.target.value)}
          size="small"
          fullWidth
        />

        <FormControl size="small" fullWidth>
          <InputLabel>Sección / curso</InputLabel>
          <Select
            label="Sección / curso"
            value={value.course}
            onChange={(event) => update('course', event.target.value)}
          >
            <MenuItem value="Todos">Todos</MenuItem>
            {courses.map((course) => (
              <MenuItem key={course} value={course}>
                {course}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Fecha desde"
          type="date"
          value={value.from ?? ''}
          onChange={(event) => update('from', event.target.value)}
          size="small"
          fullWidth
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
        />

        <TextField
          label="Fecha hasta"
          type="date"
          value={value.to ?? ''}
          onChange={(event) => update('to', event.target.value)}
          size="small"
          fullWidth
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
        />

        <Stack
          direction="row"
          spacing={1}
          sx={{ width: { xs: '100%', md: 'auto' }, whiteSpace: 'nowrap' }}
        >
          <AddButton
            label="Filtrar"
            icon={<FilterAltIcon />}
            onClick={onApply}
            sx={{ minWidth: 110 }}
          />
          <AddButton
            label="Limpiar"
            icon={<RestartAltIcon />}
            onClick={onReset}
            sx={{
              minWidth: 110,
              backgroundColor: 'transparent',
              color: '#111827',
              border: '1px solid #d1d5db',
              '&:hover': { backgroundColor: '#f3f4f6' },
            }}
          />
        </Stack>
      </Stack>
    </ContentCard>
  );
};

export default AttendanceFilters;