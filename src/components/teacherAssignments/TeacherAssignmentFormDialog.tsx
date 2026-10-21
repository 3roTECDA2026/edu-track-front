import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useNotify } from '@/components/layout/NotificationProvider';
import { createTeacherAssignment, type TeacherSummary } from '@/services/teacherAssignments.service';
import type { SubjectOption } from '@/services/subjects.service';
import type { ClassSectionOption } from '@/services/students.service';
import {
  getAssignmentErrorMessage,
  getSectionLabel,
  getTeacherName,
} from '@/components/teacherAssignments/teacherAssignmentLabels';
import {
  teacherAssignmentSchema,
  type TeacherAssignmentFormValues,
} from '@/components/teacherAssignments/teacherAssignmentSchema';

interface TeacherAssignmentFormDialogProps {
  open: boolean;
  teachers: TeacherSummary[];
  subjects: SubjectOption[];
  sections: ClassSectionOption[];
  loadingOptions: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY: TeacherAssignmentFormValues = { teacherId: '', subjectId: '', classSectionId: '' };

export const TeacherAssignmentFormDialog = ({
  open,
  teachers,
  subjects,
  sections,
  loadingOptions,
  onClose,
  onSaved,
}: TeacherAssignmentFormDialogProps) => {
  const notify = useNotify();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeacherAssignmentFormValues>({
    resolver: zodResolver(teacherAssignmentSchema),
    defaultValues: EMPTY,
  });

  // Cada vez que se abre, el formulario arranca vacío
  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const onSubmit = async (values: TeacherAssignmentFormValues) => {
    setSubmitting(true);
    try {
      // TODO(TECH-034): validar choque de horarios antes de enviar, cuando el back
      // tenga el modelo de horarios (día y franja horaria) y un endpoint para consultarlo.
      await createTeacherAssignment(values);
      notify.success('Docente asignado correctamente');
      onSaved();
      onClose();
    } catch (e) {
      notify.error(getAssignmentErrorMessage(e, 'No se pudo asignar el docente'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'contents' }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Asignar docente
          <Typography variant="body2" color="text.secondary">
            Elegí el docente, la materia y el curso donde la va a dictar.
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!loadingOptions && teachers.length === 0 && (
            <Alert severity="info">
              No hay docentes cargados. Creá usuarios con rol docente para poder asignarlos.
            </Alert>
          )}

          <Controller
            name="teacherId"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="Docente"
                disabled={loadingOptions}
                {...field}
                error={!!errors.teacherId}
                helperText={errors.teacherId?.message}
              >
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {getTeacherName(t)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="subjectId"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="Materia"
                disabled={loadingOptions}
                {...field}
                error={!!errors.subjectId}
                helperText={errors.subjectId?.message}
              >
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.gradeLevel}° año)
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="classSectionId"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="Curso"
                disabled={loadingOptions}
                {...field}
                error={!!errors.classSectionId}
                helperText={errors.classSectionId?.message}
              >
                {sections.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {getSectionLabel(s)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={submitting} color="inherit" variant="outlined">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || loadingOptions}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ bgcolor: '#111827', '&:hover': { bgcolor: '#1f2937' } }}
          >
            Asignar docente
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
