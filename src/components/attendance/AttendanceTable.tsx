import React from 'react';
import { Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { AttendanceRecord } from './attendance.types';

type AttendanceTableProps = {
  records: AttendanceRecord[];
  course: string;
  totalAbsence: (record: AttendanceRecord) => number;
  justifiedTotal: (record: AttendanceRecord) => number;
  formatTotal: (total: number) => string;
  onJustify: (record: AttendanceRecord) => void;
};

const headers = ['Alumno', 'DNI', 'Total inasistencias', 'Ausentes', 'Medias faltas', 'Cuartos', 'Justificadas', 'No justificadas', 'Justificación'];

const AttendanceTable: React.FC<AttendanceTableProps> = ({ records, course, totalAbsence, justifiedTotal, formatTotal, onJustify }) => (
  <Paper variant="outlined" sx={{ borderColor: '#d9d9d9', borderRadius: 1, overflow: 'hidden' }}>
    <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e5e5e5' }}>
      <Typography sx={{ fontWeight: 700 }}>
        Resultados {records.length ? `- ${course}` : ''}
        <Typography component="span" variant="caption" sx={{ ml: 1, color: '#7b8794', fontWeight: 400 }}>
          ({records.length} {records.length === 1 ? 'alumno' : 'alumnos'})
        </Typography>
      </Typography>
    </Stack>
    <TableContainer>
      <Table size="small" sx={{ minWidth: 980 }}>
        <TableHead><TableRow sx={{ backgroundColor: '#fafafa' }}>
          {headers.map((header) => <TableCell key={header} sx={{ fontWeight: 800, color: '#555', fontSize: 12, whiteSpace: 'nowrap' }}>{header}</TableCell>)}
        </TableRow></TableHead>
        <TableBody>
          {records.map((record) => {
            const total = totalAbsence(record);
            const justified = justifiedTotal(record);
            return <TableRow key={record.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{record.student}</TableCell>
              <TableCell sx={{ color: '#8a8a8a' }}>{record.dni}</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>{formatTotal(total)}</TableCell>
              <TableCell>{record.absences}</TableCell><TableCell>{record.halfAbsences}</TableCell><TableCell>{record.quarterAbsences}</TableCell>
              <TableCell><Chip label={justified ? formatTotal(justified) : '0'} size="small" color={justified ? 'success' : 'default'} /></TableCell>
              <TableCell>{formatTotal(Math.max(0, total - justified))}</TableCell>
              <TableCell><Stack direction="row" spacing={1} alignItems="center"><Chip label={record.justifications.length ? 'Justificado' : 'Pendiente'} size="small" color={record.justifications.length ? 'success' : 'error'} /><Button aria-label={`Ver justificaciones de ${record.student}`} onClick={() => onJustify(record)} size="small" variant="text" sx={{ minWidth: 0, textTransform: 'none' }}>{record.justifications.length ? <VisibilityIcon fontSize="small" /> : 'Justificar'}</Button></Stack></TableCell>
            </TableRow>;
          })}
          {!records.length && <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}>No hay resultados para los filtros seleccionados.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

export default AttendanceTable;
