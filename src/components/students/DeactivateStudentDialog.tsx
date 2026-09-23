import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import type { StudentListItem } from '@/services/students.service';

interface DeactivateStudentDialogProps {
  open: boolean;
  student: StudentListItem | null;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeactivateStudentDialog = ({
  open,
  student,
  loading,
  onConfirm,
  onClose,
}: DeactivateStudentDialogProps) => {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        ¿Dar de baja a {student?.firstName} {student?.lastName}?
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          El estudiante va a dejar de aparecer en los listados. Sus datos y su historial se
          conservan, y se puede consultar filtrando por estado "Inactivos" o "Todos".
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit" sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          sx={{ textTransform: 'none' }}
        >
          {loading ? 'Dando de baja...' : 'Dar de baja'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeactivateStudentDialog;
