import { Box } from '@mui/material';
import type { StudentStatus } from '@/services/students.service';
import { STATUS_CONFIG } from '@/components/students/studentLabels';

interface StudentStatusChipProps {
  status: StudentStatus;
}

export const StudentStatusChip = ({ status }: StudentStatusChipProps) => {
  const { label, color, background } = STATUS_CONFIG[status];

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 1,
        py: 0.25,
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 500,
        color,
        backgroundColor: background,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Box>
  );
};

export default StudentStatusChip;
