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
  Alert,
  Chip,
} from '@mui/material'
import type {
  IntensificationModel,
  PatePendingSubjectOption,
  PateSectionOption,
} from '@/services/pate.service'
import {
  isSectionRequiredForModel,
  MAX_SUBJECTS_TO_INTENSIFY,
  MODEL_LABELS,
} from '@/components/pate/pateLabels'
import type { SelectedIntensifyItem } from '@/components/pate/pateFormValidation'

interface PateIntensifySectionProps {
  pendingSubjects: PatePendingSubjectOption[]
  sections: PateSectionOption[]
  allowedModels: IntensificationModel[]
  selectedMap: Map<string, SelectedIntensifyItem>
  repeatSubjectIds: Set<string>
  onToggleSubject: (subjectId: string) => void
  onChangeModel: (subjectId: string, model: IntensificationModel) => void
  onChangeSection: (subjectId: string, sectionId: string) => void
}

export const PateIntensifySection: React.FC<PateIntensifySectionProps> = ({
  pendingSubjects,
  sections,
  allowedModels,
  selectedMap,
  repeatSubjectIds,
  onToggleSubject,
  onChangeModel,
  onChangeSection,
}) => {
  const selectedCount = selectedMap.size
  const isMaxReached = selectedCount >= MAX_SUBJECTS_TO_INTENSIFY

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="h6" component="div">
          1. Materias a Intensificar
        </Typography>
        <Chip
          label={`${selectedCount} de ${MAX_SUBJECTS_TO_INTENSIFY} seleccionadas`}
          size="small"
          color={selectedCount > MAX_SUBJECTS_TO_INTENSIFY ? 'error' : 'primary'}
          variant="outlined"
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Seleccioná hasta 4 materias para intensificar. Para los Modelos 2 y 3 es obligatorio
        seleccionar año, sección y turno.
      </Typography>

      {isMaxReached && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Alcanzaste el máximo de {MAX_SUBJECTS_TO_INTENSIFY} materias a intensificar. El resto de
          las materias pendientes debe ser asignado a recursado.
        </Alert>
      )}

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
              <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
                Modelo de Intensificación
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 220 }}>Sección / Turno</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingSubjects.map((subject) => {
              const isSelected = selectedMap.has(subject.pendingSubjectId)
              const isInRepeat = repeatSubjectIds.has(subject.pendingSubjectId)
              const item = selectedMap.get(subject.pendingSubjectId)
              const currentModel = item?.model ?? (allowedModels[0] || 'MODEL_1')
              const needsSection = isSectionRequiredForModel(currentModel)

              // Filtrar secciones que correspondan al mismo año de la materia
              const compatibleSections = sections.filter((s) => s.grade === subject.gradeLevel)

              return (
                <TableRow
                  key={subject.pendingSubjectId}
                  sx={{
                    bgcolor: isSelected ? 'action.selected' : 'inherit',
                    opacity: isInRepeat ? 0.4 : 1,
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      disabled={isInRepeat || (!isSelected && isMaxReached)}
                      onChange={() => onToggleSubject(subject.pendingSubjectId)}
                      slotProps={{
                        input: {
                          'aria-label': `intensificar ${subject.subjectName}`,
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
                      <FormControl size="small" fullWidth>
                        <Select
                          value={currentModel}
                          onChange={(e) =>
                            onChangeModel(
                              subject.pendingSubjectId,
                              e.target.value as IntensificationModel
                            )
                          }
                          aria-label={`modelo para ${subject.subjectName}`}
                        >
                          {allowedModels.map((m) => (
                            <MenuItem key={m} value={m}>
                              {MODEL_LABELS[m]}
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
                  <TableCell>
                    {isSelected && needsSection ? (
                      <FormControl size="small" fullWidth error={!item?.targetClassSectionId}>
                        <Select
                          value={item?.targetClassSectionId || ''}
                          displayEmpty
                          onChange={(e) =>
                            onChangeSection(subject.pendingSubjectId, e.target.value)
                          }
                          aria-label={`sección para ${subject.subjectName}`}
                        >
                          <MenuItem value="">
                            <em>Seleccionar sección...</em>
                          </MenuItem>
                          {compatibleSections.map((sec) => (
                            <MenuItem key={sec.id} value={sec.id}>
                              {sec.grade}° "{sec.division}" ({sec.shift})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : isSelected ? (
                      <Typography variant="caption" color="text.secondary">
                        (Misma sección / turno propio)
                      </Typography>
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
