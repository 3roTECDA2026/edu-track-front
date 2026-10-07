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
import BlockIcon from '@mui/icons-material/Block';
import type { StudentListItem } from '@/services/students.service';
import { EditButton } from '@/components/common/EditButton';
import { SHIFT_LABELS } from '@/components/students/studentLabels';
import { StudentStatusChip } from '@/components/students/StudentStatusChip';

const COLUMNS = ['Legajo', 'Apellido', 'Nombre', 'DNI', 'Año', 'Sección', 'Turno', 'Estado', 'Acciones'];
const SKELETON_ROWS = 8;
const EMPTY = '—';

// Los encabezados de tabla toman su estilo del theme (estándar MUI del equipo).
const headerCellSx = {
  whiteSpace: 'nowrap',
};

const bodyCellSx = {
  color: '#374151',
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
    // En pantallas chicas la tabla se desplaza horizontalmente para que se lean todas las columnas.
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
                    <TableCell key={column}>
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
                    <TableCell sx={{ ...bodyCellSx, fontWeight: 700, color: '#111827' }}>
                      {student.recordNumber}
                    </TableCell>
                    <TableCell sx={bodyCellSx}>{student.lastName}</TableCell>
                    <TableCell sx={bodyCellSx}>{student.firstName}</TableCell>
                    <TableCell sx={bodyCellSx}>{student.dni}</TableCell>
                    <TableCell sx={bodyCellSx}>{section ? `${section.grade}° Año` : EMPTY}</TableCell>
                    <TableCell sx={bodyCellSx}>{section?.division ?? EMPTY}</TableCell>
                    <TableCell sx={bodyCellSx}>{section ? SHIFT_LABELS[section.shift] : EMPTY}</TableCell>
                    <TableCell sx={bodyCellSx}>
                      <StudentStatusChip status={student.status} />
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap', py: 1 }}>
                      <Tooltip title="Ver ficha">
                        <IconButton
                          size="small"
                          aria-label="Ver ficha"
                          onClick={() => onView(student)}
                          sx={{ color: '#374151' }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {/* Lápiz estándar del equipo para editar */}
                      <EditButton onClick={() => onEdit(student)} />

                      {/* La baja es lógica: el alumno pasa a inactivo, no se elimina */}
                      <Tooltip title={isInactive ? 'Ya está dado de baja' : 'Dar de baja'}>
                        {/* El span permite que el tooltip funcione aunque el botón esté deshabilitado */}
                        <span>
                          <IconButton
                            size="small"
                            aria-label="Dar de baja"
                            disabled={isInactive}
                            onClick={() => onDeactivate(student)}
                          >
                            <BlockIcon fontSize="small" sx={{ color: isInactive ? '#9ca3af' : '#dc2626' }} />
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
