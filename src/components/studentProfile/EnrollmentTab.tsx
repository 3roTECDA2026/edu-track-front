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
import type { StudentDetail } from '@/services/students.service';
import type { EnrollmentHistoryItem } from '@/components/StudentProfile/studentProfile.service';
import { SHIFT_LABELS } from '@/components/students/studentLabels';
import { InfoCard } from '@/components/studentProfile/InfoCard';
import { SoftBadge } from '@/components/studentProfile/SoftBadge';
import { TabError, TabLoading } from '@/components/studentProfile/TabStates';
import { bodyCellSx, headerCellSx, sectionTitleSx } from '@/components/studentProfile/profileStyles';
import { EMPTY, formatDate } from '@/components/studentProfile/profileLabels';

interface EnrollmentTabProps {
  student: StudentDetail;
  history: EnrollmentHistoryItem[] | undefined;
  loading: boolean;
  error: string | undefined;
  onRetry: () => void;
}

const HISTORY_COLUMNS = ['Ciclo lectivo', 'Curso', 'Turno', 'Desde', 'Hasta', 'Motivo de egreso'];

export const EnrollmentTab = ({ student, history, loading, error, onRetry }: EnrollmentTabProps) => {
  const section = student.currentSection;

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {section ? (
        <InfoCard
          title="Ciclo lectivo actual"
          fields={[
            { label: 'Ciclo lectivo', value: section.year },
            { label: 'Año', value: `${section.grade}° Año` },
            { label: 'Sección', value: section.division },
            { label: 'Turno', value: SHIFT_LABELS[section.shift] },
          ]}
        />
      ) : (
        <InfoCard title="Ciclo lectivo actual">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            El estudiante no tiene una inscripción activa en el ciclo lectivo actual.
          </Typography>
        </InfoCard>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Typography sx={{ ...sectionTitleSx, px: 2.5, pt: 2.5, mb: 1 }}>Historial de inscripciones</Typography>

        {loading && !history ? (
          <Box sx={{ p: 2.5 }}>
            <TabLoading />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2.5 }}>
            <TabError message={error} onRetry={onRetry} />
          </Box>
        ) : !history || history.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', px: 2.5, pb: 2.5 }}>
            No hay inscripciones registradas.
          </Typography>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  {HISTORY_COLUMNS.map((column) => (
                    <TableCell key={column} sx={headerCellSx}>
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={bodyCellSx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {item.year}
                        {!item.endDate && <SoftBadge label="Actual" color="#1e8e3e" background="#e6f4ea" />}
                      </Box>
                    </TableCell>
                    <TableCell sx={bodyCellSx}>{item.section}</TableCell>
                    <TableCell sx={bodyCellSx}>{SHIFT_LABELS[item.shift]}</TableCell>
                    <TableCell sx={bodyCellSx}>{formatDate(item.startDate)}</TableCell>
                    <TableCell sx={bodyCellSx}>{item.endDate ? formatDate(item.endDate) : 'En curso'}</TableCell>
                    <TableCell sx={bodyCellSx}>{item.leaveReason ?? EMPTY}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default EnrollmentTab;
