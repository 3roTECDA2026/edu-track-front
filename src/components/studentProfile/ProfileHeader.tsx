import { Avatar, Box, Button, Paper, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import type { StudentDetail } from '@/services/students.service';
import { StudentStatusChip } from '@/components/students/StudentStatusChip';
import { SHIFT_LABELS } from '@/components/students/studentLabels';
import { getInitials } from '@/components/studentProfile/profileLabels';
import { COLORS, cardSx } from '@/components/studentProfile/profileStyles';

interface ProfileHeaderProps {
  student: StudentDetail;
  onEdit: () => void;
  onRegisterAttendance: () => void;
  onChangeStatus: () => void;
}

const outlinedButtonSx = { borderColor: COLORS.border, color: COLORS.tableText } as const;

export const ProfileHeader = ({ student, onEdit, onRegisterAttendance, onChangeStatus }: ProfileHeaderProps) => {
  const section = student.currentSection;
  const isInactive = student.status === 'INACTIVE';

  const details = [
    `Legajo ${student.recordNumber}`,
    `DNI ${student.dni}`,
    section ? `${section.grade}° Año ${section.division} · Turno ${SHIFT_LABELS[section.shift]}` : null,
  ].filter(Boolean);

  return (
    <Paper
      variant="outlined"
      sx={{
        ...cardSx,
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 3,
      }}
    >
      {/* Foto provisoria: iniciales hasta que existan fotos de los alumnos */}
      <Avatar
        sx={{
          width: 72,
          height: 72,
          backgroundColor: COLORS.surface,
          color: COLORS.label,
          fontSize: '1.5rem',
          fontWeight: 700,
        }}
      >
        {getInitials(student.firstName, student.lastName)}
      </Avatar>

      <Box sx={{ flex: '1 1 260px', minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="h6">
            {student.lastName}, {student.firstName}
          </Typography>
          <StudentStatusChip status={student.status} />
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {details.join(' · ')}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" color="inherit" startIcon={<EditIcon />} onClick={onEdit} sx={outlinedButtonSx}>
          Editar datos
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<EventAvailableIcon />}
          onClick={onRegisterAttendance}
          sx={outlinedButtonSx}
        >
          Registrar asistencia
        </Button>
        <Tooltip title={isInactive ? 'El estudiante ya está dado de baja' : ''}>
          {/* El span permite que el tooltip funcione aunque el botón esté deshabilitado */}
          <span>
            <Button
              variant="contained"
              disableElevation
              startIcon={<SwapHorizIcon />}
              onClick={onChangeStatus}
              disabled={isInactive}
            >
              Cambiar estado
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default ProfileHeader;