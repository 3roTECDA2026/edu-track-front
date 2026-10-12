import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material'
import { useClassSections } from '@/hooks/useClassSections'
import { useStudents } from '@/hooks/useStudents'
import { useDebounce } from '@/hooks/useDebounce'
import { useStudentGrades } from '@/hooks/useStudentGrades'
import type { StudentListItem } from '@/services/students.service'
import { average, gradeLevel, GRADE_COLORS } from '@/utils/grades'

const headSx = {
  fontWeight: 700,
  color: '#4b5563',
  fontSize: '0.75rem',
  letterSpacing: '0.05em',
  backgroundColor: '#fafafa',
} as const


function valueCell(value: number | undefined, strong = false) {
  const c = GRADE_COLORS[gradeLevel(value)]
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        minWidth: 42,
        py: 0.25,
        px: 1,
        borderRadius: 1,
        bgcolor: c.bg,
        color: c.fg,
        fontWeight: strong ? 800 : 700,
      }}
    >
      {value ?? '—'}
    </Box>
  )
}

export const PorAlumnoTab: React.FC = () => {
  
  const { sections } = useClassSections()
  const yearOptions = useMemo(
    () => Array.from(new Set(sections.map((s) => s.year))).sort((a, b) => b - a),
    [sections],
  )
  const [year, setYear] = useState<number | ''>('')
  useEffect(() => {
    if (year === '' && yearOptions.length > 0) setYear(yearOptions[0])
  }, [yearOptions, year])

  const [selected, setSelected] = useState<StudentListItem | null>(null)
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 400)

  const { data: studentsData, loading: loadingStudents } = useStudents({
    page: 1,
    limit: 20,
    search: debounced,
    grade: '',
    division: '',
    shift: '',
    status: 'active',
  })
  const studentOptions = studentsData?.data ?? []

  
  const { rows, loading, error } = useStudentGrades(
    selected?.id ?? '',
    year === '' ? undefined : year,
  )

 
  const finalFor = (row: (typeof rows)[number]) => {
    const a1 = average(row.grade?.term1Scores ?? [])
    const a2 = average(row.grade?.term2Scores ?? [])
    return average([a1, a2])
  }
  
  const generalAverage = average(rows.map((r) => finalFor(r)))

  return (
    <Box sx={{ p: 2 }}>
      {/* Filtros: alumno + año */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
        <Autocomplete
          sx={{ minWidth: 320 }}
          size="small"
          options={studentOptions}
          loading={loadingStudents}
          value={selected}
          onChange={(_, v) => setSelected(v)}
          onInputChange={(_, v) => setSearch(v)}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          getOptionLabel={(o) => `${o.lastName}, ${o.firstName} — DNI ${o.dni}`}
          renderInput={(params) => (
            <TextField {...params} label="Alumno" placeholder="Buscar por apellido o DNI" />
          )}
          noOptionsText="Sin resultados"
        />

        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel id="lbl-year-alumno">Año</InputLabel>
          <Select
            labelId="lbl-year-alumno"
            label="Año"
            value={year === '' ? '' : String(year)}
            onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <MenuItem key={y} value={String(y)}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Estado / tabla */}
      {!selected ? (
        <Alert severity="info">Elegí un alumno para ver el promedio de sus materias.</Alert>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : error ? (
        <Alert severity="error">No se pudo cargar: {error}</Alert>
      ) : rows.length === 0 ? (
        <Alert severity="info">
          {selected.lastName}, {selected.firstName} no tiene materias cargadas en {year}.
        </Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#fafafa' }}>
              <TableRow>
                <TableCell sx={headSx}>MATERIA</TableCell>
                <TableCell align="center" sx={headSx}>
                  PROMEDIO 1° CUATRIMESTRE
                </TableCell>
                <TableCell align="center" sx={headSx}>
                  PROMEDIO 2° CUATRIMESTRE
                </TableCell>
                <TableCell align="center" sx={headSx}>
                  FINAL
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => {
                const a1 = average(r.grade?.term1Scores ?? [])
                const a2 = average(r.grade?.term2Scores ?? [])
                const fin = average([a1, a2])
                return (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ color: '#111827', whiteSpace: 'nowrap' }}>
                      {r.subject.name}
                    </TableCell>
                    <TableCell align="center">{valueCell(a1)}</TableCell>
                    <TableCell align="center">{valueCell(a2)}</TableCell>
                    <TableCell align="center">{valueCell(fin)}</TableCell>
                  </TableRow>
                )
              })}

              {/* Fila final: promedio general */}
              <TableRow>
                <TableCell
                  sx={{ ...headSx, backgroundColor: 'transparent', borderTop: '2px solid #d1d5db' }}
                  
                >
                  PROMEDIO
                </TableCell>
                <TableCell sx={{ borderTop: '2px solid #d1d5db' }} />
                <TableCell sx={{ borderTop: '2px solid #d1d5db' }} />
                <TableCell align="center" sx={{ borderTop: '2px solid #d1d5db' }}>
                  {valueCell(generalAverage, true)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

export default PorAlumnoTab
