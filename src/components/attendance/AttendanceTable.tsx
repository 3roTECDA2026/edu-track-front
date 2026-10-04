import React from 'react';
import {
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCard from '@/components/common/ContentCard';
import type { AttendanceRecord } from '@/components/attendance/attendance.types';

type AttendanceTableProps = {
  records: AttendanceRecord[];
  course: string;
  totalAbsence: (record: AttendanceRecord) => number;
  justifiedTotal: (record: AttendanceRecord) => number;
  formatTotal: (total: number) => string;
  onJustify: (record: AttendanceRecord) => void;
};

const headers = [
  { label: 'Alumno', align: 'left' as const },
  { label: 'DNI', align: 'left' as const },
  { label: 'Total inasistencias', align: 'center' as const },
  { label: 'Ausentes', align: 'center' as const },
  { label: 'Medias faltas', align: 'center' as const },
  { label: 'Cuartos', align: 'center' as const },
  { label: 'Justificadas', align: 'center' as const },
  { label: 'No justificadas', align: 'center' as const },
  { label: 'Acciones', align: 'right' as const },
];

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  course,
  totalAbsence,
  justifiedTotal,
  formatTotal,
  onJustify,
}) => (
  <ContentCard sx={{ mb: 3 }}>
    <Stack
      direction="row"
      sx={{
        px: 2,
        py: 1.5,
        borderBottom: '1px solid #e5e7eb',
        alignItems: 'center',
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827' }}>
        Resultados {records.length ? `- ${course}` : ''}
        <Typography
          component="span"
          variant="caption"
          sx={{ ml: 1, color: '#6b7280', fontWeight: 400 }}
        >
          ({records.length} {records.length === 1 ? 'alumno' : 'alumnos'})
        </Typography>
      </Typography>
    </Stack>
    <TableContainer>
      <Table size="small" sx={{ minWidth: 980 }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#fafafa' }}>
            {headers.map((header) => (
              <TableCell
                key={header.label}
                align={header.align}
                sx={{
                  fontWeight: 600,
                  color: '#374151',
                  whiteSpace: 'nowrap',
                }}
              >
                {header.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => {
            const total = totalAbsence(record);
            const justified = justifiedTotal(record);
            const notJustified = Math.max(0, total - justified);
            const hasJustifications = record.justifications.length > 0;

            return (
              <TableRow key={record.id} hover>
                <TableCell sx={{ color: '#111827' }}>{record.student}</TableCell>
                <TableCell sx={{ color: '#6b7280' }}>{record.dni}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: '#111827' }}>
                  {formatTotal(total)}
                </TableCell>
                <TableCell align="center">{record.absences}</TableCell>
                <TableCell align="center">{record.halfAbsences}</TableCell>
                <TableCell align="center">{record.quarterAbsences}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={justified ? formatTotal(justified) : '0'}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: justified ? '#111827' : '#e5e7eb',
                      color: '#111827',
                      fontWeight: 500,
                    }}
                  />
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: notJustified > 0 ? '#111827' : '#6b7280' }}
                >
                  {formatTotal(notJustified)}
                </TableCell>
                <TableCell align="right">
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      justifyContent: 'flex-end', // ✅ Movido a sx
                      alignItems: 'center',       // ✅ Movido a sx
                    }}
                  >
                    <Chip
                      label={hasJustifications ? 'Justificado' : 'Pendiente'}
                      size="small"
                      sx={{
                        backgroundColor: hasJustifications ? '#f3f4f6' : '#fef2f2',
                        color: hasJustifications ? '#111827' : '#dc2626',
                        fontWeight: 500,
                      }}
                    />
                    <Button
                      aria-label={`Ver justificaciones de ${record.student}`}
                      onClick={() => onJustify(record)}
                      size="small"
                      variant="text"
                      startIcon={
                        hasJustifications ? <VisibilityIcon fontSize="small" /> : undefined
                      }
                      sx={{
                        color: '#111827',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: '#f3f4f6' },
                      }}
                    >
                      {hasJustifications ? 'Ver' : 'Justificar'}
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
          {!records.length && (
            <TableRow>
              <TableCell
                colSpan={9}
                align="center"
                sx={{ py: 5, color: '#6b7280' }}
              >
                No hay resultados para los filtros seleccionados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </ContentCard>
);

export default AttendanceTable;