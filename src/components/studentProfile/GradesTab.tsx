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
import SchoolIcon from '@mui/icons-material/School';
import type { PreliminaryAssessment, StudentGrade } from '@/components/StudentProfile/studentProfile.service';
import { SoftBadge } from '@/components/studentProfile/SoftBadge';
import { TabEmpty, TabError, TabLoading } from '@/components/studentProfile/TabStates';
import { bodyCellSx, headerCellSx, sectionTitleSx } from '@/components/studentProfile/profileStyles';
import {
  ASSESSMENT_CONFIG,
  EMPTY,
  PASSING_SCORE,
  SUBJECT_STATUS_LABELS,
} from '@/components/studentProfile/profileLabels';

interface GradesTabProps {
  grades: StudentGrade[] | undefined;
  loading: boolean;
  error: string | undefined;
  onRetry: () => void;
}

const COLUMNS = ['Materia', 'Valoración 1° C', 'Nota 1° C', 'Valoración 2° C', 'Nota 2° C', 'Nota final', 'Estado'];

const AssessmentBadge = ({ value }: { value: PreliminaryAssessment | null }) => {
  if (!value) return <>{EMPTY}</>;
  const config = ASSESSMENT_CONFIG[value];
  return <SoftBadge label={value} color={config.color} background={config.background} title={config.description} />;
};

// Scores below the passing grade are highlighted in red.
const Score = ({ value }: { value: number | null }) => {
  if (value === null) return <>{EMPTY}</>;
  const failing = value < PASSING_SCORE;
  return (
    <Box component="span" sx={{ fontWeight: failing ? 700 : 500, color: failing ? '#c5221f' : 'inherit' }}>
      {value}
    </Box>
  );
};

export const GradesTab = ({ grades, loading, error, onRetry }: GradesTabProps) => {
  if (loading && !grades) return <TabLoading />;
  if (error) return <TabError message={error} onRetry={onRetry} />;
  if (!grades || grades.length === 0) {
    return (
      <TabEmpty
        icon={<SchoolIcon />}
        title="Sin calificaciones cargadas"
        text="Cuando los docentes carguen las notas del estudiante, van a aparecer acá."
      />
    );
  }

  const latestYear = Math.max(...grades.map((grade) => grade.enrollment.academicYear.year));
  const rows = grades
    .filter((grade) => grade.enrollment.academicYear.year === latestYear)
    .sort((a, b) => a.enrollment.subject.name.localeCompare(b.enrollment.subject.name, 'es'));

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{
          px: 2.5,
          pt: 2.5,
          pb: 1,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Typography sx={{ ...sectionTitleSx, mb: 0 }}>Calificaciones · Ciclo lectivo {latestYear}</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {(Object.keys(ASSESSMENT_CONFIG) as PreliminaryAssessment[]).map((key) => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <AssessmentBadge value={key} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {ASSESSMENT_CONFIG[key].description.replace('Trayectoria Educativa ', '')}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableCell
                  key={column}
                  align={column === 'Materia' || column === 'Estado' ? 'left' : 'center'}
                  sx={headerCellSx}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((grade) => (
              <TableRow key={grade.id} hover>
                <TableCell sx={{ ...bodyCellSx, fontWeight: 500 }}>{grade.enrollment.subject.name}</TableCell>
                <TableCell align="center" sx={bodyCellSx}>
                  <AssessmentBadge value={grade.preliminaryAssessment1} />
                </TableCell>
                <TableCell align="center" sx={bodyCellSx}>
                  <Score value={grade.term1Score} />
                </TableCell>
                <TableCell align="center" sx={bodyCellSx}>
                  <AssessmentBadge value={grade.preliminaryAssessment2} />
                </TableCell>
                <TableCell align="center" sx={bodyCellSx}>
                  <Score value={grade.term2Score} />
                </TableCell>
                <TableCell align="center" sx={bodyCellSx}>
                  <Score value={grade.finalScore} />
                </TableCell>
                <TableCell sx={bodyCellSx}>{SUBJECT_STATUS_LABELS[grade.subjectStatus]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default GradesTab;
