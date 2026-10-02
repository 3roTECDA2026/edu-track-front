import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button, MenuItem,
  Select, FormControl, InputLabel, Alert, CircularProgress, Divider, Link,
} from '@mui/material';
import { useClassSections } from '@/hooks/useClassSections';
import { createStudent, type CreateStudentInput, type StudentDetail } from '@/services/students.service';
import { ApiError } from '@/services/api';
import { SHIFT_LABELS } from './studentLabels';
import {
  EMPTY_STUDENT_FORM, validateStudentForm,
  type StudentFormValues, type FormErrors,
} from './studentFormValidation';

type Step = 'form' | 'review' | 'success';

function mapBackendFieldErrors(details: unknown): FormErrors {
  const errors: FormErrors = {};
  if (!details || typeof details !== 'object' || !('fieldErrors' in details)) return errors;

  const fieldErrors = (details as { fieldErrors: Record<string, string[]> }).fieldErrors;
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const message = messages[0];
    if (!message) continue;
    if (field === 'classSectionId') {
      errors.shift = message; // el select de turno es el último de la cadena, ahí mostramos el error de sección
    } else if (field in EMPTY_STUDENT_FORM) {
      errors[field as keyof StudentFormValues] = message;
    }
  }
  return errors;
}

export function StudentForm() {
  const { sections, loading: loadingSections, error: sectionsError } = useClassSections();

  const [step, setStep] = useState<Step>('form');
  const [values, setValues] = useState<StudentFormValues>(EMPTY_STUDENT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [createdStudent, setCreatedStudent] = useState<StudentDetail | null>(null);

  const gradeOptions = [...new Set(sections.map((s) => s.grade))].sort((a, b) => a - b);
  const divisionOptions = [...new Set(
    sections.filter((s) => s.grade === Number(values.grade)).map((s) => s.division),
  )].sort();
  const shiftOptions = [...new Set(
    sections
      .filter((s) => s.grade === Number(values.grade) && s.division === values.division)
      .map((s) => s.shift),
  )];

  const matchedSection = sections.find(
    (s) => s.grade === Number(values.grade) && s.division === values.division && s.shift === values.shift,
  );

  function handleField(field: keyof StudentFormValues) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function handleGradeChange(e: { target: { value: string } }) {
    setValues((prev) => ({ ...prev, grade: e.target.value, division: '', shift: '' }));
    setErrors((prev) => ({ ...prev, grade: undefined }));
  }

  function handleDivisionChange(e: { target: { value: string } }) {
    setValues((prev) => ({ ...prev, division: e.target.value, shift: '' }));
    setErrors((prev) => ({ ...prev, division: undefined }));
  }

  function handleShiftChange(e: { target: { value: string } }) {
    setValues((prev) => ({ ...prev, shift: e.target.value }));
    setErrors((prev) => ({ ...prev, shift: undefined }));
  }

  function handleReview() {
    const newErrors = validateStudentForm(values);
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) setStep('review');
  }

  async function handleConfirm() {
    if (!matchedSection) return;
    setSubmitting(true);
    setSubmitError(undefined);

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
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setErrors(mapBackendFieldErrors(err.details));
        setStep('form');
      } else if (err instanceof ApiError && err.status === 409) {
        setErrors({ dni: 'Ya existe un estudiante registrado con ese DNI' });
        setStep('form');
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Error inesperado al guardar');
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ===================== ÉXITO =====================
  if (step === 'success' && createdStudent) {
    return (
      <Card sx={{ borderRadius: 4, boxShadow: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }} color="success.main" gutterBottom>
            ✅ Alumno registrado con éxito
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 1 }}>
            {createdStudent.firstName} {createdStudent.lastName} — Legajo {createdStudent.recordNumber}
          </Typography>
          <Link component={RouterLink} to="/students" sx={{ display: 'inline-block', mt: 2 }}>
            Ver ficha del alumno
          </Link>
        </CardContent>
      </Card>
    );
  }

  // ===================== REVISIÓN =====================
  if (step === 'review') {
    return (
      <Card sx={{ borderRadius: 4, boxShadow: 3, maxWidth: 700, mx: 'auto', mt: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }} gutterBottom>
            Revisá los datos antes de guardar
          </Typography>

          {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

          <ReviewSection title="Datos personales" rows={[
            ['Apellido', values.lastName], ['Nombre', values.firstName], ['DNI', values.dni],
            ['Fecha de nacimiento', values.dateOfBirth], ['Lugar de nacimiento', values.placeOfBirth],
          ]} />
          <ReviewSection title="Domicilio" rows={[
            ['Calle', values.address], ['Localidad', values.city], ['Teléfono', values.phone],
          ]} />
          <ReviewSection title="Inscripción" rows={[
            ['Curso', `${values.grade}°`], ['Sección', values.division],
            ['Turno', SHIFT_LABELS[values.shift as keyof typeof SHIFT_LABELS] ?? values.shift],
          ]} />
          <ReviewSection title="Adulto responsable" rows={[
            ['Nombre', values.guardianName], ['Teléfono', values.guardianPhone], ['Email', values.guardianEmail],
            ...(values.guardianDni ? [['DNI', values.guardianDni] as [string, string]] : []),
            ...(values.guardianRelationship ? [['Vínculo', values.guardianRelationship] as [string, string]] : []),
          ]} />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={() => setStep('form')} disabled={submitting}>Volver a editar</Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {submitting ? 'Guardando...' : 'Confirmar y guardar'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // ===================== FORMULARIO =====================
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }} gutterBottom>Nuevo alumno</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Completá los datos del estudiante para inscribirlo en el sistema
      </Typography>

      <FormSection title="Datos personales">
        <Row>
          <TextField label="Apellido" value={values.lastName} onChange={handleField('lastName')} error={!!errors.lastName} helperText={errors.lastName} fullWidth />
          <TextField label="Nombre" value={values.firstName} onChange={handleField('firstName')} error={!!errors.firstName} helperText={errors.firstName} fullWidth />
          <TextField label="DNI" value={values.dni} onChange={handleField('dni')} error={!!errors.dni} helperText={errors.dni} fullWidth />
        </Row>
        <Row>
          <TextField label="Fecha de nacimiento" type="date" slotProps={{ inputLabel: { shrink: true } }} value={values.dateOfBirth} onChange={handleField('dateOfBirth')} error={!!errors.dateOfBirth} helperText={errors.dateOfBirth} fullWidth />
          <TextField label="Lugar de nacimiento" value={values.placeOfBirth} onChange={handleField('placeOfBirth')} error={!!errors.placeOfBirth} helperText={errors.placeOfBirth} fullWidth />
        </Row>
      </FormSection>

      <FormSection title="Domicilio">
        <Row>
          <TextField label="Calle y número" value={values.address} onChange={handleField('address')} error={!!errors.address} helperText={errors.address} fullWidth />
          <TextField label="Localidad" value={values.city} onChange={handleField('city')} error={!!errors.city} helperText={errors.city} fullWidth />
          <TextField label="Teléfono" value={values.phone} onChange={handleField('phone')} error={!!errors.phone} helperText={errors.phone} fullWidth />
        </Row>
      </FormSection>

      <FormSection title="Inscripción">
        {sectionsError && <Alert severity="error" sx={{ mb: 2 }}>No se pudieron cargar los cursos: {sectionsError}</Alert>}
        <Row>
          <FormControl fullWidth error={!!errors.grade} disabled={loadingSections}>
            <InputLabel>Curso</InputLabel>
            <Select label="Curso" value={values.grade} onChange={handleGradeChange}>
              {gradeOptions.map((g) => <MenuItem key={g} value={String(g)}>{g}°</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth error={!!errors.division} disabled={!values.grade}>
            <InputLabel>Sección</InputLabel>
            <Select label="Sección" value={values.division} onChange={handleDivisionChange}>
              {divisionOptions.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth error={!!errors.shift} disabled={!values.division}>
            <InputLabel>Turno</InputLabel>
            <Select label="Turno" value={values.shift} onChange={handleShiftChange}>
              {shiftOptions.map((s) => <MenuItem key={s} value={s}>{SHIFT_LABELS[s]}</MenuItem>)}
            </Select>
          </FormControl>
        </Row>
      </FormSection>

      <FormSection title="Adulto responsable">
        <Row>
          <TextField label="Nombre y apellido" value={values.guardianName} onChange={handleField('guardianName')} error={!!errors.guardianName} helperText={errors.guardianName} fullWidth />
          <TextField label="Vínculo" value={values.guardianRelationship} onChange={handleField('guardianRelationship')} fullWidth />
          <TextField label="DNI del adulto responsable" value={values.guardianDni} onChange={handleField('guardianDni')} error={!!errors.guardianDni} helperText={errors.guardianDni} fullWidth />
        </Row>
        <Row>
          <TextField label="Teléfono de contacto" value={values.guardianPhone} onChange={handleField('guardianPhone')} error={!!errors.guardianPhone} helperText={errors.guardianPhone} fullWidth />
          <TextField label="Email" value={values.guardianEmail} onChange={handleField('guardianEmail')} error={!!errors.guardianEmail} helperText={errors.guardianEmail} fullWidth />
        </Row>
      </FormSection>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="contained" size="large" onClick={handleReview}>
          Revisar datos
        </Button>
      </Box>
    </Box>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 1, mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>{title}</Typography>
        {children}
      </CardContent>
    </Card>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(200px, 1fr))' }, gap: 2, mb: 2 }}>
      {children}
    </Box>
  );
}

function ReviewSection({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} color="text.secondary">{title}</Typography>
      <Divider sx={{ mb: 1 }} />
      {rows.map(([label, value]) => (
        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{value || '—'}</Typography>
        </Box>
      ))}
    </Box>
  );
}