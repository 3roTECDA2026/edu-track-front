import React from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { PateResponse, PateSectionOption } from '@/services/pate.service'
import { MODEL_SHORT_LABELS } from '@/components/pate/pateLabels'
import { SHIFT_LABELS } from '@/components/students/studentLabels'

type SubjectToIntensify = NonNullable<PateResponse['subjectsToIntensify']>[number]
type SubjectToRepeat = NonNullable<PateResponse['subjectsToRepeat']>[number]

interface PateSubjectsSummaryProps {
  subjectsToIntensify: SubjectToIntensify[]
  subjectsToRepeat: SubjectToRepeat[]
}

const sectionText = (section: PateSectionOption) =>
  `${section.grade}° ${section.division} · ${SHIFT_LABELS[section.shift]}`

const intensifySectionText = (subject: SubjectToIntensify) => {
  if (subject.targetClassSection) return sectionText(subject.targetClassSection)
  return subject.model === 'MODEL_1' ? 'Misma sección / turno propio' : '—'
}

export const PateSubjectsSummary: React.FC<PateSubjectsSummaryProps> = ({
  subjectsToIntensify,
  subjectsToRepeat,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Materias a Intensificar
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Materia</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Año</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Modelo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sección / Turno</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjectsToIntensify.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>
                    No hay materias para intensificar.
                  </TableCell>
                </TableRow>
              ) : (
                subjectsToIntensify.map((subject) => (
                  <TableRow key={subject.id} hover>
                    <TableCell>{subject.subjectName}</TableCell>
                    <TableCell>
                      {subject.gradeLevel}° año · Origen: {subject.originYear}
                    </TableCell>
                    <TableCell>{MODEL_SHORT_LABELS[subject.model]}</TableCell>
                    <TableCell>{intensifySectionText(subject)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Materias a Recursar
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Materia</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Año</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sección / Turno</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjectsToRepeat.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary' }}>
                    No hay materias para recursar.
                  </TableCell>
                </TableRow>
              ) : (
                subjectsToRepeat.map((subject) => (
                  <TableRow key={subject.id} hover>
                    <TableCell>{subject.subjectName}</TableCell>
                    <TableCell>
                      {subject.gradeLevel}° año · Origen: {subject.originYear}
                    </TableCell>
                    <TableCell>{sectionText(subject.classSection)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  )
}
