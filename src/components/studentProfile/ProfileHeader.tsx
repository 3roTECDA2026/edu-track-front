import { Avatar, Box, Button, Paper, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import type { StudentDetail } from '@/services/students.service';
import { StudentStatusChip } from '@/components/students/StudentStatusChip';
import { SHIFT_LABELS } from '@/components/students/studentLabels';
import { getInitials } from '@/components/studentProfile/profileLabels';
import { darkButtonSx } from '@/components/studentProfile/profileStyles';

interface ProfileHeaderProps {
  student: StudentDetail;
  onEdit: () => void;
  onRegisterAttendance: () => void;
  onChangeStatus: () => void;
}

const outlinedButtonSx = { textTransform: 'none', borderColor: '#dadce0' } as const;

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
        borderRadius: 2,
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 3,
      }}
    >
      {/* Photo placeholder: initials until student photos exist */}
      <Avatar
        sx={{
          width: 72,
          height: 72,
          backgroundColor: '#e8eaed',
          color: '#5f6368',
          fontSize: '1.5rem',
          fontWeight: 700,
        }}
      >
        {getInitials(student.firstName, student.lastName)}
      </Avatar>

      <Box sx={{ flex: '1 1 260px', minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
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
          {/* The span lets the tooltip work even when the button is disabled */}
          <span>
            <Button
              variant="contained"
              disableElevation
              startIcon={<SwapHorizIcon />}
              onClick={onChangeStatus}
              disabled={isInactive}
              sx={darkButtonSx}
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
