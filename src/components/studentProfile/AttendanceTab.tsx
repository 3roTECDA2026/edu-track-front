import { useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import type { AttendanceRecord } from '@/services/studentProfile.service';
import { TabEmpty, TabError, TabLoading } from '@/components/studentProfile/TabStates';
import { COLORS, bodyCellSx, cardSx, headerCellSx, labelSx } from '@/components/studentProfile/profileStyles';
import { ATTENDANCE_WEIGHT, formatAbsences, formatMonth } from '@/components/studentProfile/profileLabels';

interface AttendanceTabProps {
  records: AttendanceRecord[] | undefined;
  loading: boolean;
  error: string | undefined;
  onRetry: () => void;
}

interface MonthRow {
  month: string;
  days: number;
  absent: number;
  half: number;
  quarter: number;
  total: number;
  justified: number;
}

const MONTH_COLUMNS = ['Mes', 'Días registrados', 'Ausentes', 'Medias faltas', 'Cuartos de falta', 'Total', 'Justificadas'];
const UNJUSTIFIED_ALERT_LIMIT = 5;

function buildMonthlySummary(records: AttendanceRecord[]) {
  const months = new Map<string, MonthRow>();

  for (const record of records) {
    const key = record.date.slice(0, 7); // "YYYY-MM"
    const row = months.get(key) ?? { month: key, days: 0, absent: 0, half: 0, quarter: 0, total: 0, justified: 0 };
    const weight = ATTENDANCE_WEIGHT[record.value];

    row.days += 1;
    if (record.value === 'ABSENT') row.absent += 1;
    if (record.value === 'HALF') row.half += 1;
    if (record.value === 'QUARTER') row.quarter += 1;
    row.total += weight;
    if (record.justified) row.justified += weight;

    months.set(key, row);
  }

  const rows = [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
  const totals = rows.reduce<MonthRow>(
    (acc, row) => ({
      month: 'total',
      days: acc.days + row.days,
      absent: acc.absent + row.absent,
      half: acc.half + row.half,
      quarter: acc.quarter + row.quarter,
      total: acc.total + row.total,
      justified: acc.justified + row.justified,
    }),
    { month: 'total', days: 0, absent: 0, half: 0, quarter: 0, total: 0, justified: 0 },
  );

  return { rows, totals };
}

interface StatCardProps {
  label: string;
  value: string;
  caption?: string;
  highlight?: boolean;
}

const StatCard = ({ label, value, caption, highlight }: StatCardProps) => (
  <Paper variant="outlined" sx={{ ...cardSx, p: 2 }}>
    <Typography sx={{ ...labelSx, mb: 1 }}>{label}</Typography>
    <Typography
      sx={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2, color: highlight ? COLORS.danger : COLORS.ink }}
    >
      {value}
    </Typography>
    {caption && (
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {caption}
      </Typography>
    )}
  </Paper>
);

const totalCellSx = { ...bodyCellSx, fontWeight: 700, color: COLORS.ink };

export const AttendanceTab = ({ records, loading, error, onRetry }: AttendanceTabProps) => {
  const summary = useMemo(() => (records ? buildMonthlySummary(records) : null), [records]);

  if (loading && !records) return <TabLoading />;
  if (error) return <TabError message={error} onRetry={onRetry} />;
  if (!summary || summary.rows.length === 0) {
    return (
      <TabEmpty
        icon={<EventNoteIcon />}
        title="Sin registros de asistencia"
        text="Cuando se cargue la asistencia del estudiante, el resumen va a aparecer acá."
      />
    );
  }

  const { rows, totals } = summary;
  const unjustified = totals.total - totals.justified;

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
        <StatCard
          label="Inasistencias totales"
          value={formatAbsences(totals.total)}
          caption={`${totals.absent} ausentes · ${totals.half} medias · ${totals.quarter} cuartos`}
        />
        <StatCard label="Justificadas" value={formatAbsences(totals.justified)} />
        <StatCard
          label="Injustificadas"
          value={formatAbsences(unjustified)}
          highlight={unjustified > UNJUSTIFIED_ALERT_LIMIT}
        />
        <StatCard label="Días registrados" value={String(totals.days)} caption="En el ciclo lectivo actual" />
      </Box>

      <Paper variant="outlined" sx={{ ...cardSx, overflow: 'hidden' }}>
        <Typography variant="h6" sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
          Detalle por mes
        </Typography>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                {MONTH_COLUMNS.map((column) => (
                  <TableCell key={column} align={column === 'Mes' ? 'left' : 'right'} sx={headerCellSx}>
                    {column}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.month} hover>
                  <TableCell sx={{ ...bodyCellSx, fontWeight: 700, color: COLORS.ink }}>{formatMonth(row.month)}</TableCell>
                  <TableCell align="right" sx={bodyCellSx}>{row.days}</TableCell>
                  <TableCell align="right" sx={bodyCellSx}>{row.absent}</TableCell>
                  <TableCell align="right" sx={bodyCellSx}>{row.half}</TableCell>
                  <TableCell align="right" sx={bodyCellSx}>{row.quarter}</TableCell>
                  <TableCell align="right" sx={{ ...bodyCellSx, fontWeight: 600 }}>
                    {formatAbsences(row.total)}
                  </TableCell>
                  <TableCell align="right" sx={bodyCellSx}>{formatAbsences(row.justified)}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ backgroundColor: '#fafafa' }}>
                <TableCell sx={totalCellSx}>Total</TableCell>
                <TableCell align="right" sx={totalCellSx}>{totals.days}</TableCell>
                <TableCell align="right" sx={totalCellSx}>{totals.absent}</TableCell>
                <TableCell align="right" sx={totalCellSx}>{totals.half}</TableCell>
                <TableCell align="right" sx={totalCellSx}>{totals.quarter}</TableCell>
                <TableCell align="right" sx={totalCellSx}>{formatAbsences(totals.total)}</TableCell>
                <TableCell align="right" sx={totalCellSx}>{formatAbsences(totals.justified)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AttendanceTab;