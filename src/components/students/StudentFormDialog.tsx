import { useEffect, useState, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, Link, MenuItem, TextField, Typography,
} from '@mui/material';
import { useNotify } from '@/components/layout/NotificationProvider';
import { useClassSections } from '@/hooks/useClassSections';
import { ApiError } from '@/services/api';
import { createStudent, type CreateStudentInput, type StudentDetail } from '@/services/students.service';
import { SHIFT_LABELS } from '@/components/students/studentLabels';
import { studentSchema, EMPTY_STUDENT_FORM, BACKEND_FIELD_MAP, type StudentFormValues } from '@/components/students/studentSchema';

interface StudentFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type Step = 'form' | 'review' | 'success';

const gridSx = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
} as const;

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
    <Typography sx={{ px: 2, py: 1.25, fontWeight: 700, fontSize: 14, borderBottom: 1, borderColor: 'divider' }}>
      {title}
    </Typography>
    <Box sx={{ p: 2 }}>{children}</Box>
  </Box>
);

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '—'}</Typography>
  </Box>
);

export const StudentFormDialog = ({ open, onClose, onSaved }: StudentFormDialogProps) => {
  const notify = useNotify();
  const { sections, loading: loadingSections, error: sectionsError } = useClassSections();

  const [step, setStep] = useState<Step>('form');
  const [submitting, setSubmitting] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<StudentDetail | null>(null);

  const {
    control, register, handleSubmit, reset, setError, watch,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: EMPTY_STUDENT_FORM,
  });

  const grade = watch('grade');
  const division = watch('division');

  useEffect(() => {
    if (open) {
      reset(EMPTY_STUDENT_FORM);
      setStep('form');
      setCreatedStudent(null);
    }
  }, [open, reset]);

  const gradeOptions = [...new Set(sections.map((s) => s.grade))].sort((a, b) => a - b);
  const divisionOptions = [...new Set(sections.filter((s) => s.grade === Number(grade)).map((s) => s.division))].sort();
  const shiftOptions = [...new Set(
    sections.filter((s) => s.grade === Number(grade) && s.division === division).map((s) => s.shift),
  )];

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const reviewValues = watch();

  const onReview = () => setStep('review');

  const onConfirm = async () => {
    const values = reviewValues;
    const matchedSection = sections.find(
      (s) => s.grade === Number(values.grade) && s.division === values.division && s.shift === values.shift,
    );
    if (!matchedSection) {
      notify.error('No se encontró la combinación de curso/sección/turno elegida');
      setStep('form');
      return;
    }

    setSubmitting(true);
    const payload: CreateStudentInput = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      dni: values.dni.trim(),
      dateOfBirth: values.dateOfBirth,
      placeOfBirth: values.placeOfBirth.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      phone: values.phone.trim(),
      classSectionId: matchedSection.id,
      guardianName: values.guardianName.trim(),
      guardianPhone: values.guardianPhone.trim(),
      guardianEmail: values.guardianEmail.trim(),
      ...(values.guardianDni.trim() ? { guardianDni: values.guardianDni.trim() } : {}),
      ...(values.guardianRelationship.trim() ? { guardianRelationship: values.guardianRelationship.trim() } : {}),
    };

    try {
      const student = await createStudent(payload);
      setCreatedStudent(student);
      setStep('success');
      onSaved(); // refresca la tabla ya, sin esperar a que cierren el modal
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        const fieldErrors = (e.details as { fieldErrors?: Record<string, string[]> } | undefined)?.fieldErrors ?? {};
        for (const [backendField, messages] of Object.entries(fieldErrors)) {
          const formField = BACKEND_FIELD_MAP[backendField];
          if (formField && messages[0]) setError(formField, { message: messages[0] });
        }
        setStep('form');
      } else if (e instanceof ApiError && e.status === 409) {
        setError('dni', { message: 'Ya existe un estudiante registrado con ese DNI' });
        setStep('form');
      } else {
        notify.error(e instanceof Error ? e.message : 'No se pudo guardar el estudiante');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
      {step === 'success' && createdStudent ? (
        <>
          <DialogContent sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
              ✅ Alumno registrado con éxito
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {createdStudent.firstName} {createdStudent.lastName} — Legajo {createdStudent.recordNumber}
            </Typography>
            <Link component={RouterLink} to={`/students/${createdStudent.id}`} onClick={onClose}>
              Ver ficha del alumno
            </Link>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={onClose} variant="contained">Cerrar</Button>
          </DialogActions>
        </>
      ) : step === 'review' ? (
        <>
          <DialogTitle sx={{ fontWeight: 700 }}>Revisá los datos antes de guardar</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} color="text.secondary">Datos personales</Typography>
              <Divider sx={{ mb: 1 }} />
              <ReviewRow label="Apellido" value={reviewValues.lastName} />
              <ReviewRow label="Nombre" value={reviewValues.firstName} />
              <ReviewRow label="DNI" value={reviewValues.dni} />
              <ReviewRow label="Fecha de nacimiento" value={reviewValues.dateOfBirth} />
              <ReviewRow label="Lugar de nacimiento" value={reviewValues.placeOfBirth} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} color="text.secondary">Domicilio</Typography>
              <Divider sx={{ mb: 1 }} />
              <ReviewRow label="Calle" value={reviewValues.address} />
              <ReviewRow label="Localidad" value={reviewValues.city} />
              <ReviewRow label="Teléfono" value={reviewValues.phone} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} color="text.secondary">Inscripción</Typography>
              <Divider sx={{ mb: 1 }} />
              <ReviewRow label="Curso" value={`${reviewValues.grade}°`} />
              <ReviewRow label="Sección" value={reviewValues.division} />
              <ReviewRow label="Turno" value={SHIFT_LABELS[reviewValues.shift as keyof typeof SHIFT_LABELS] ?? reviewValues.shift} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} color="text.secondary">Adulto responsable</Typography>
              <Divider sx={{ mb: 1 }} />
              <ReviewRow label="Nombre" value={reviewValues.guardianName} />
              <ReviewRow label="Teléfono" value={reviewValues.guardianPhone} />
              <ReviewRow label="Email" value={reviewValues.guardianEmail} />
              {reviewValues.guardianDni && <ReviewRow label="DNI" value={reviewValues.guardianDni} />}
              {reviewValues.guardianRelationship && <ReviewRow label="Vínculo" value={reviewValues.guardianRelationship} />}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setStep('form')} disabled={submitting} color="inherit" variant="outlined">
              Volver a editar
            </Button>
            <Button
              variant="contained"
              onClick={onConfirm}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
              sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#000' } }}
            >
              {submitting ? 'Guardando...' : 'Confirmar y guardar'}
            </Button>
          </DialogActions>
        </>
      ) : (
        <form onSubmit={handleSubmit(onReview)} noValidate style={{ display: 'contents' }}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Nuevo alumno
            <Typography variant="body2" color="text.secondary">
              Completá los datos del estudiante para inscribirlo en el sistema.
            </Typography>
          </DialogTitle>

          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Section title="Datos personales">
              <Box sx={gridSx}>
                <TextField label="Apellido" autoFocus {...register('lastName')} error={!!errors.lastName} helperText={errors.lastName?.message} />
                <TextField label="Nombre" {...register('firstName')} error={!!errors.firstName} helperText={errors.firstName?.message} />
                <TextField label="DNI" {...register('dni')} error={!!errors.dni} helperText={errors.dni?.message} />
                <TextField label="Fecha de nacimiento" type="date" slotProps={{ inputLabel: { shrink: true } }} {...register('dateOfBirth')} error={!!errors.dateOfBirth} helperText={errors.dateOfBirth?.message} />
                <TextField label="Lugar de nacimiento" {...register('placeOfBirth')} error={!!errors.placeOfBirth} helperText={errors.placeOfBirth?.message} />
              </Box>
            </Section>

            <Section title="Domicilio">
              <Box sx={gridSx}>
                <TextField label="Calle y número" {...register('address')} error={!!errors.address} helperText={errors.address?.message} />
                <TextField label="Localidad" {...register('city')} error={!!errors.city} helperText={errors.city?.message} />
                <TextField label="Teléfono" {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} />
              </Box>
            </Section>

            <Section title="Inscripción">
              {sectionsError && <Alert severity="error" sx={{ mb: 2 }}>No se pudieron cargar los cursos: {sectionsError}</Alert>}
              <Box sx={gridSx}>
                <Controller
                  name="grade"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select label="Curso" disabled={loadingSections}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={!!errors.grade} helperText={errors.grade?.message}
                    >
                      {gradeOptions.map((g) => <MenuItem key={g} value={String(g)}>{g}°</MenuItem>)}
                    </TextField>
                  )}
                />
                <Controller
                  name="division"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select label="Sección" disabled={!grade}
                      {...field}
                      error={!!errors.division} helperText={errors.division?.message}
                    >
                      {divisionOptions.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </TextField>
                  )}
                />
                <Controller
                  name="shift"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select label="Turno" disabled={!division}
                      {...field}
                      error={!!errors.shift} helperText={errors.shift?.message}
                    >
                      {shiftOptions.map((s) => <MenuItem key={s} value={s}>{SHIFT_LABELS[s]}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Box>
            </Section>

            <Section title="Adulto responsable">
              <Box sx={gridSx}>
                <TextField label="Nombre y apellido" {...register('guardianName')} error={!!errors.guardianName} helperText={errors.guardianName?.message} />
                <TextField label="Vínculo" {...register('guardianRelationship')} error={!!errors.guardianRelationship} helperText={errors.guardianRelationship?.message} />
                <TextField label="DNI del adulto responsable" {...register('guardianDni')} error={!!errors.guardianDni} helperText={errors.guardianDni?.message} />
                <TextField label="Teléfono de contacto" {...register('guardianPhone')} error={!!errors.guardianPhone} helperText={errors.guardianPhone?.message} />
                <TextField label="Email" {...register('guardianEmail')} error={!!errors.guardianEmail} helperText={errors.guardianEmail?.message} />
              </Box>
            </Section>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleClose} color="inherit" variant="outlined">Cancelar</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#000' } }}>
              Revisar datos
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
};

export default StudentFormDialog;