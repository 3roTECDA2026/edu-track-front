import React from 'react'
import {
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
} from '@mui/material'
import type { PatePendingSubjectOption } from '@/services/pate.service'

interface PateHeaderSummaryProps {
  student: {
    firstName: string
    lastName: string
    dni: string
    status?: string
  }
  year: number
  pendingSubjects: PatePendingSubjectOption[]
  currentSubjectsCount: number
  maxSubjectsPerCycle: number
}

export const PateHeaderSummary: React.FC<PateHeaderSummaryProps> = ({
  student,
  year,
  pendingSubjects,
  currentSubjectsCount,
  maxSubjectsPerCycle,
}) => {
  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Box
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" component="div">
              {student.lastName}, {student.firstName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              DNI: {student.dni} · Ciclo Lectivo del PATE: <strong>{year}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}>
            <Chip
              label={`Materias actuales en el ciclo: ${currentSubjectsCount}`}
              variant="outlined"
              size="small"
            />
            <Chip
              label={`Tope máximo: ${maxSubjectsPerCycle}`}
              variant="outlined"
              size="small"
              color={currentSubjectsCount > maxSubjectsPerCycle ? 'error' : 'default'}
            />
          </Box>
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Materias Pendientes de Acreditación (MPAA) — Total: {pendingSubjects.length}
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="tabla de mpaa pendientes">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Materia</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Año de la Materia</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ciclo de Origen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingSubjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                    No se registran materias pendientes de ciclos anteriores.
                  </TableCell>
                </TableRow>
              ) : (
                pendingSubjects.map((ps) => (
                  <TableRow key={ps.pendingSubjectId}>
                    <TableCell>{ps.subjectName}</TableCell>
                    <TableCell>{ps.gradeLevel}° año</TableCell>
                    <TableCell>{ps.originYear}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Stack>
  )
}
