import React from 'react'
import {
  Box,
  Typography,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import type { PateFollowUp } from '@/services/pate.service'
import { EVALUATION_COLORS, EVALUATION_LABELS } from '@/components/pate/pateLabels'

interface FollowUpHistoryTableProps {
  followUps: PateFollowUp[]
}

export const FollowUpHistoryTable: React.FC<FollowUpHistoryTableProps> = ({ followUps }) => {
  if (followUps.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No hay seguimientos registrados para este PATE todavía.
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell sx={{ fontWeight: 600, width: 130 }}>Fecha</TableCell>
            <TableCell sx={{ fontWeight: 600, width: 170 }}>Reunión EDTE</TableCell>
            <TableCell sx={{ fontWeight: 600, width: 130 }}>Evaluación</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Avances Observados</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Observaciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {followUps.map((f) => (
            <TableRow key={f.id} hover>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <Typography variant="body2">
                  {new Date(f.date).toLocaleDateString('es-AR')}
                </Typography>
                {f.createdBy && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {f.createdBy.name}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2">{f.edteMeeting.date}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Período: {f.edteMeeting.period}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={EVALUATION_LABELS[f.evaluation]}
                  color={EVALUATION_COLORS[f.evaluation]}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell sx={{ whiteSpace: 'pre-line' }}>
                <Typography variant="body2">{f.progress}</Typography>
              </TableCell>
              <TableCell sx={{ whiteSpace: 'pre-line' }}>
                <Typography variant="body2" color="text.secondary">
                  {f.observations || '—'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
