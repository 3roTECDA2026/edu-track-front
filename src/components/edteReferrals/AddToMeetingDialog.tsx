import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'

import { AddButton } from '@/components/common/AddButton'
import {
  MEETING_PERIOD_LABELS,
  formatDate,
  listDraftMeetings,
} from '@/components/edteReferrals/meetingLinks'
import type { ReferralRow } from '@/components/edteReferrals/referralRows'
import { useLazyResource } from '@/hooks/useLazyResource'

interface AddToMeetingDialogProps {
  student: ReferralRow
  year: number // Ciclo de las reuniones
  onClose: () => void
  onChooseMeeting: (meetingId: string) => void
  onNewMeeting: () => void
}

// Elegir a qué reunión del EDTE sumar a un derivado (CRM-074, criterio 3). Solo lista las
// reuniones en borrador: una reunión firmada ya no se puede modificar (CRM-075).
export function AddToMeetingDialog({
  student,
  year,
  onClose,
  onChooseMeeting,
  onNewMeeting,
}: AddToMeetingDialogProps) {
  const meetings = useLazyResource(`draft-meetings:${year}`, (signal) =>
    listDraftMeetings(year, signal)
  )

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        Agregar a {student.lastName}, {student.firstName} a una reunión
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          Elegí una reunión en borrador del ciclo {year}. El alumno se agrega en el formulario de la
          reunión y se guarda desde ahí.
        </Typography>

        {meetings.loading ? (
          <CircularProgress
            size={24}
            aria-label="Cargando reuniones"
            sx={{ display: 'block', mx: 'auto', my: 2 }}
          />
        ) : meetings.error ? (
          <Alert severity="error">No se pudieron cargar las reuniones. {meetings.error}</Alert>
        ) : (meetings.data ?? []).length === 0 ? (
          <Typography variant="body2" sx={{ py: 1 }}>
            No hay reuniones en borrador en {year}.
          </Typography>
        ) : (
          <List dense disablePadding>
            {(meetings.data ?? []).map((meeting) => (
              <ListItemButton key={meeting.id} onClick={() => onChooseMeeting(meeting.id)}>
                <ListItemText
                  primary={`${formatDate(meeting.date)} · ${MEETING_PERIOD_LABELS[meeting.period]}`}
                  secondary={
                    meeting.studentsCount === 1 ? '1 alumno' : `${meeting.studentsCount} alumnos`
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <AddButton label="Nueva reunión" onClick={onNewMeeting} />
      </DialogActions>
    </Dialog>
  )
}
