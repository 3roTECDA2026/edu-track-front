import React from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  Chip,
} from '@mui/material'
import type { PatePendingSubjectOption, PateSectionOption } from '@/services/pate.service'
import type { SelectedRepeatItem } from '@/components/pate/pateFormValidation'

interface PateRepeatSectionProps {
  pendingSubjects: PatePendingSubjectOption[]
  sections: PateSectionOption[]
  selectedMap: Map<string, SelectedRepeatItem>
  intensifySubjectIds: Set<string>
  onToggleSubject: (subjectId: string) => void
  onChangeSection: (subjectId: string, sectionId: string) => void
}

export const PateRepeatSection: React.FC<PateRepeatSectionProps> = ({
  pendingSubjects,
  sections,
  selectedMap,
  intensifySubjectIds,
  onToggleSubject,
  onChangeSection,
}) => {
  const selectedCount = selectedMap.size

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="h6" component="div">
          2. Materias a Recursar
        </Typography>
        <Chip
          label={`${selectedCount} seleccionadas`}
          size="small"
          variant="outlined"
          color="default"
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Seleccioná las materias que el alumno recursará y asigná la sección/turno correspondiente al
        año de la materia (puede ser en el mismo turno o a contraturno).
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Typography variant="caption" sx={{ fontWeight: 600, pl: 1 }}>
                  Sel.
                </Typography>
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Materia</TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 260 }}>
                Sección / Turno de Recursado
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingSubjects.map((subject) => {
              const isSelected = selectedMap.has(subject.pendingSubjectId)
              const isInIntensify = intensifySubjectIds.has(subject.pendingSubjectId)
              const item = selectedMap.get(subject.pendingSubjectId)

              // Las recursadas deben ser en secciones del año escolar de la materia
              const compatibleSections = sections.filter((s) => s.grade === subject.gradeLevel)

              return (
                <TableRow
                  key={subject.pendingSubjectId}
                  sx={{
                    bgcolor: isSelected ? 'action.selected' : 'inherit',
                    opacity: isInIntensify ? 0.4 : 1,
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      disabled={isInIntensify}
                      onChange={() => onToggleSubject(subject.pendingSubjectId)}
                      slotProps={{
                        input: {
                          'aria-label': `recursar ${subject.subjectName}`,
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 400 }}>
                      {subject.subjectName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {subject.gradeLevel}° año · Origen: {subject.originYear}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {isSelected ? (
                      <FormControl size="small" fullWidth error={!item?.classSectionId}>
                        <Select
                          value={item?.classSectionId || ''}
                          displayEmpty
                          onChange={(e) =>
                            onChangeSection(subject.pendingSubjectId, e.target.value)
                          }
                          aria-label={`sección recursado para ${subject.subjectName}`}
                        >
                          <MenuItem value="">
                            <em>Seleccionar sección ({subject.gradeLevel}° año)...</em>
                          </MenuItem>
                          {compatibleSections.map((sec) => (
                            <MenuItem key={sec.id} value={sec.id}>
                              {sec.grade}° "{sec.division}" ({sec.shift})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
