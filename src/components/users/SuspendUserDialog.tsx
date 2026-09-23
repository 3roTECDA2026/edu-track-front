import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import type { UserListItem } from '@/services/users.service';

interface SuspendUserDialogProps {
  open: boolean;
  user: UserListItem | null;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const SuspendUserDialog = ({
  open,
  user,
  loading,
  onConfirm,
  onClose,
}: SuspendUserDialogProps) => {
  const suspending = user?.active ?? true;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{suspending ? 'Suspender usuario' : 'Reactivar usuario'}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {suspending
            ? `${user?.name} no va a poder iniciar sesión hasta que lo reactives.`
            : `${user?.name} va a poder volver a iniciar sesión.`}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={suspending ? 'error' : 'success'}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {suspending ? 'Suspender' : 'Reactivar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};