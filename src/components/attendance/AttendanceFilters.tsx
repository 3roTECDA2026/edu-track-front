import React from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import type { AttendanceFilters as AttendanceFilterValues } from './attendance.types';

type AttendanceFiltersProps = {
  value: AttendanceFilterValues;
  courses: string[];
  onChange: (filters: AttendanceFilterValues) => void;
  onApply: () => void;
};

const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({ value, courses, onChange, onApply }) => {
  const update = (field: keyof AttendanceFilterValues, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <Paper className="print-hidden" variant="outlined" sx={{ mb: 2, borderColor: '#d9d9d9', borderRadius: 1 }}>
      <Typography sx={{ px: 2, py: 1.5, fontWeight: 700, borderBottom: '1px solid #e5e5e5' }}>
        Filtros de búsqueda
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2 }}>
        <TextField label="Alumno o DNI" value={value.search} onChange={(event) => update('search', event.target.value)} size="small" fullWidth />
        <FormControl size="small" fullWidth>
          <InputLabel>Sección / curso</InputLabel>
          <Select label="Sección / curso" value={value.course} onChange={(event) => update('course', event.target.value)}>
            <MenuItem value="Todos">Todos</MenuItem>
            {courses.map((course) => <MenuItem key={course} value={course}>{course}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField label="Desde" type="date" value={value.from} onChange={(event) => update('from', event.target.value)} size="small" fullWidth InputLabelProps={{ shrink: true }} />
        <TextField label="Hasta" type="date" value={value.to} onChange={(event) => update('to', event.target.value)} size="small" fullWidth InputLabelProps={{ shrink: true }} />
        <Button variant="contained" startIcon={<FilterAltIcon />} onClick={onApply} sx={{ minWidth: 120, textTransform: 'none', backgroundColor: '#222', '&:hover': { backgroundColor: '#444' } }}>
          Filtrar
        </Button>
      </Stack>
    </Paper>
  );
};

export default AttendanceFilters;
