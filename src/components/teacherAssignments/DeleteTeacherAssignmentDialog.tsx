import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import type { TeacherAssignment } from '@/services/teacherAssignments.service';
import { getSectionLabel, getTeacherName } from '@/components/teacherAssignments/teacherAssignmentLabels';

interface DeleteTeacherAssignmentDialogProps {
  open: boolean;
  assignment: TeacherAssignment | null;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteTeacherAssignmentDialog = ({
  open,
  assignment,
  loading,
  onConfirm,
  onClose,
}: DeleteTeacherAssignmentDialogProps) => {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Quitar asignación</DialogTitle>
      <DialogContent>
        {assignment && (
          <DialogContentText>
            {getTeacherName(assignment.teacher)} dejará de dictar {assignment.subject.name} en{' '}
            {getSectionLabel(assignment.classSection)}. Podés volver a asignarlo cuando quieras.
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit" variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          color="error"
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Quitar asignación
        </Button>
      </DialogActions>
    </Dialog>
  );
};
