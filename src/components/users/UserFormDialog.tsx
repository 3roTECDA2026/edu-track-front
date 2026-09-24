import { useEffect, useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useNotify } from '@/components/layout/NotificationProvider';
import { useCourses } from '@/hooks/useCourses';
import {
  ApiError,
  ROLES,
  createUser,
  updateUser,
  type Role,
  type UserListItem,
  type UserPayload,
} from '@/services/users.service';
import { ROLE_LABELS } from './userLabels';
import { PASSWORD_MIN, buildUserSchema, type UserFormValues } from './userSchemas';

interface UserFormDialogProps {
  open: boolean;
  user: UserListItem | null; // null = crear, usuario = editar
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY: UserFormValues = {
  firstName: '',
  lastName: '',
  dni: '',
  email: '',
  phone: '',
  username: '',
  role: '',
  active: true,
  courseIds: [],
  password: '',
  confirmPassword: '',
};

// Campos únicos: el backend responde 409 con details: { field }
const UNIQUE_MESSAGES = {
  email: 'Ya existe un usuario con este email',
  username: 'Ese nombre de usuario ya está en uso',
  dni: 'Ya existe un usuario con este DNI',
} as const;
type UniqueField = keyof typeof UNIQUE_MESSAGES;

const gridSx = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
} as const;

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
    <Typography
      sx={{ px: 2, py: 1.25, fontWeight: 700, fontSize: 14, borderBottom: 1, borderColor: 'divider' }}
    >
      {title}
    </Typography>
    <Box sx={{ p: 2 }}>{children}</Box>
  </Box>
);

export const UserFormDialog = ({ open, user, onClose, onSaved }: UserFormDialogProps) => {
  const isEdit = !!user;
  const notify = useNotify();
  const [submitting, setSubmitting] = useState(false);
  const { courses, loading: loadingCourses, error: coursesError } = useCourses(open);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(buildUserSchema(isEdit ? 'edit' : 'create')),
    defaultValues: EMPTY,
  });

  const isTeacher = watch('role') === 'docente';

  // Cada vez que se abre, cargamos los datos del usuario (o el form vacío)
  useEffect(() => {
    if (!open) return;
    reset(
      user
        ? {
            ...EMPTY,
            firstName: user.firstName,
            lastName: user.lastName,
            dni: user.dni,
            email: user.email,
            phone: user.phone ?? '',
            username: user.username,
            role: user.role,
            active: user.active,
            courseIds: user.courseIds ?? [],
          }
        : EMPTY,
    );
  }, [open, user, reset]);

  const onSubmit = async (values: UserFormValues) => {
    setSubmitting(true);
    try {
      const base: UserPayload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        dni: values.dni.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || null,
        username: values.username.trim(),
        role: values.role as Role,
        active: values.active,
        courseIds: values.role === 'docente' ? values.courseIds : [],
      };

      if (isEdit && user) {
        await updateUser(user.id, { ...base, ...(values.password ? { password: values.password } : {}) });
        notify.success('Usuario actualizado correctamente');
      } else {
        await createUser({ ...base, password: values.password });
        notify.success('Usuario creado correctamente');
      }
      onSaved();
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const field = (e.details as { field?: string } | undefined)?.field;
        if (field && field in UNIQUE_MESSAGES) {
          setError(field as UniqueField, { message: UNIQUE_MESSAGES[field as UniqueField] });
        } else {
          notify.error(e.message);
        }
      } else {
        notify.error(e instanceof Error ? e.message : 'No se pudo guardar el usuario');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth scroll="paper">
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'contents' }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
          <Typography variant="body2" color="text.secondary">
            {isEdit
              ? 'Modificá los datos del usuario.'
              : 'Completá los datos para crear un nuevo acceso al sistema.'}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Section title="Datos personales">
            <Box sx={gridSx}>
              <TextField
                label="Nombre"
                placeholder="Ej: María"
                autoFocus
                {...register('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
              <TextField
                label="Apellido"
                placeholder="Ej: González"
                {...register('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
              <TextField
                label="DNI"
                placeholder="Ej: 25456789"
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                {...register('dni')}
                error={!!errors.dni}
                helperText={errors.dni?.message}
              />
              <TextField
                label="Email"
                type="email"
                placeholder="correo@escuela.edu"
                sx={{ gridColumn: { sm: 'span 2' } }}
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <TextField
                label="Teléfono (opcional)"
                placeholder="Ej: 351 555-1234"
                {...register('phone')}
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            </Box>
          </Section>

          <Section title="Datos de acceso">
            <Box sx={gridSx}>
              <TextField
                label="Nombre de usuario"
                placeholder="Ej: mgonzalez"
                autoComplete="off"
                {...register('username')}
                error={!!errors.username}
                helperText={errors.username?.message}
              />
              <TextField
                label={isEdit ? 'Nueva contraseña' : 'Contraseña'}
                type="password"
                autoComplete="new-password"
                placeholder={`Mínimo ${PASSWORD_MIN} caracteres`}
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message ?? (isEdit ? 'Dejala vacía para no cambiarla' : undefined)}
              />
              <TextField
                label="Confirmar contraseña"
                type="password"
                autoComplete="new-password"
                placeholder="Repetir contraseña"
                {...register('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
              />
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Rol"
                    sx={{ gridColumn: { sm: 'span 2' } }}
                    {...field}
                    error={!!errors.role}
                    helperText={errors.role?.message}
                  >
                    {ROLES.map((r) => (
                      <MenuItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label="Usuario activo"
                    control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  />
                )}
              />
            </Box>
          </Section>

          <Section title="Asignación a cursos (solo docentes)">
            {!isTeacher && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Elegí el rol Docente para asignar cursos.
              </Typography>
            )}
            {loadingCourses && <CircularProgress size={20} />}
            {isTeacher && coursesError && (
              <Alert severity="error">No se pudieron cargar los cursos: {coursesError}</Alert>
            )}
            {!loadingCourses && !coursesError && (
              <Controller
                name="courseIds"
                control={control}
                render={({ field }) => (
                  <FormGroup>
                    {courses.map((c) => (
                      <FormControlLabel
                        key={c.id}
                        label={c.label}
                        disabled={!isTeacher}
                        control={
                          <Checkbox
                            size="small"
                            checked={field.value.includes(c.id)}
                            onChange={(e) =>
                              field.onChange(
                                e.target.checked
                                  ? [...field.value, c.id]
                                  : field.value.filter((id) => id !== c.id),
                              )
                            }
                          />
                        }
                      />
                    ))}
                  </FormGroup>
                )}
              />
            )}
          </Section>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={submitting} color="inherit" variant="outlined">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#000' } }}
          >
            {isEdit ? 'Guardar cambios' : 'Guardar usuario'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};