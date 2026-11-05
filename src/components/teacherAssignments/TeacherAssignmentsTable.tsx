import {
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { StandardTablePagination } from '@/components/common/StandardTablePagination';
import type { TeacherAssignment } from '@/services/teacherAssignments.service';
import { getShiftLabel, getTeacherName } from '@/components/teacherAssignments/teacherAssignmentLabels';

interface TeacherAssignmentsTableProps {
  assignments: TeacherAssignment[]; // ya paginadas
  total: number;
  loading: boolean;
  page: number; // base 0 (MUI)
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onDelete: (assignment: TeacherAssignment) => void;
}

const headSx = { fontWeight: 700, fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' } as const;

export const TeacherAssignmentsTable = ({
  assignments,
  total,
  loading,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onDelete,
}: TeacherAssignmentsTableProps) => {
  return (
    <>
      <TableContainer>
        {loading && <LinearProgress sx={{ height: 2 }} />}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={headSx}>Docente</TableCell>
              <TableCell sx={headSx}>Materia</TableCell>
              <TableCell sx={headSx}>Curso</TableCell>
              <TableCell sx={headSx}>Turno</TableCell>
              <TableCell sx={headSx}>Ciclo lectivo</TableCell>
              <TableCell sx={headSx} align="right">
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && assignments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay asignaciones para estos filtros. Usá “Asignar docente” para crear una.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {assignments.map((a) => (
              <TableRow key={a.id} hover>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }}>{getTeacherName(a.teacher)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {a.teacher.email}
                  </Typography>
                </TableCell>
                <TableCell>{a.subject.name}</TableCell>
                <TableCell>
                  {a.classSection.grade}° {a.classSection.division}
                </TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{getShiftLabel(a.classSection.shift)}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{a.classSection.academicYear.year}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="Quitar asignación">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDelete(a)}
                      aria-label={`Quitar a ${getTeacherName(a.teacher)} de ${a.subject.name}`}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <StandardTablePagination
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        itemLabel="asignaciones"
      />
    </>
  );
};
