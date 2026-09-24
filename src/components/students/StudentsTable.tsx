import {
  IconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { StudentListItem } from '@/services/students.service';
import { SHIFT_LABELS } from '@/components/students/studentLabels';
import { StudentStatusChip } from '@/components/students/StudentStatusChip';

const COLUMNS = ['Legajo', 'Apellido', 'Nombre', 'DNI', 'Año', 'Sección', 'Turno', 'Estado', 'Acciones'];
const SKELETON_ROWS = 8;
const EMPTY = '—';

const headerCellSx = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#5f6368',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid #e0e0e0',
};

const bodyCellSx = {
  fontSize: '0.85rem',
  py: 2,
  borderBottom: '1px solid #eeeeee',
};

interface StudentsTableProps {
  students: StudentListItem[];
  loading: boolean;
  onView: (student: StudentListItem) => void;
  onEdit: (student: StudentListItem) => void;
  onDeactivate: (student: StudentListItem) => void;
}

export const StudentsTable = ({ students, loading, onView, onEdit, onDeactivate }: StudentsTableProps) => {
  return (
    // Horizontal scroll on small screens keeps every column readable.
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableCell key={column} align={column === 'Acciones' ? 'center' : 'left'} sx={headerCellSx}>
                {column}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {loading
            ? Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {COLUMNS.map((column) => (
                    <TableCell key={column} sx={bodyCellSx}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : students.map((student) => {
                const section = student.currentSection;
                const isInactive = student.status === 'INACTIVE';

                return (
                  <TableRow key={student.id} hover>
                    <TableCell sx={bodyCellSx}>{student.recordNumber}</TableCell>
                    <TableCell sx={bodyCellSx}>{student.lastName}</TableCell>
                    <TableCell sx={bodyCellSx}>{student.firstName}</TableCell>
                    <TableCell sx={bodyCellSx}>{student.dni}</TableCell>
                    <TableCell sx={bodyCellSx}>{section ? `${section.grade}° Año` : EMPTY}</TableCell>
                    <TableCell sx={bodyCellSx}>{section?.division ?? EMPTY}</TableCell>
                    <TableCell sx={bodyCellSx}>{section ? SHIFT_LABELS[section.shift] : EMPTY}</TableCell>
                    <TableCell sx={bodyCellSx}>
                      <StudentStatusChip status={student.status} />
                    </TableCell>
                    <TableCell align="center" sx={{ ...bodyCellSx, whiteSpace: 'nowrap', py: 1 }}>
                      <Tooltip title="Ver ficha">
                        <IconButton size="small" aria-label="Ver ficha" onClick={() => onView(student)}>
                          <VisibilityIcon fontSize="small" sx={{ color: '#202124' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" aria-label="Editar" onClick={() => onEdit(student)}>
                          <EditIcon fontSize="small" sx={{ color: '#202124' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={isInactive ? 'Ya está dado de baja' : 'Dar de baja'}>
                        {/* The span lets the tooltip work even when the button is disabled */}
                        <span>
                          <IconButton
                            size="small"
                            aria-label="Dar de baja"
                            disabled={isInactive}
                            onClick={() => onDeactivate(student)}
                          >
                            <DeleteIcon fontSize="small" sx={{ color: isInactive ? '#bdbdbd' : '#c5221f' }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default StudentsTable;
