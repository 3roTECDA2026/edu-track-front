
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
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';

import { useNotify } from '@/components/layout/NotificationProvider';

import {
  ApiError,
  ROLES,
  createUser,
  updateUser,
  type Role,
  type UserListItem,
  type UserPayload,
} from '@/services/users.service';

import { ROLE_LABELS } from '@/components/users/userLabels';

import {
  PASSWORD_MIN,
  buildUserSchema,
  type UserFormValues,
} from '@/components/users/userSchemas';

// Propiedades del formulario.
interface UserFormDialogProps {
  open: boolean;
  user: UserListItem | null;
  onClose: () => void;
  onSaved: () => void;
}

// Valores iniciales.
// Conservamos campos heredados para que el formulario
// siga siendo compatible con userSchemas.ts.
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

// Mensajes para errores de duplicación.
const UNIQUE_MESSAGES = {
  email: 'Ya existe un usuario con este email',
} as const;

// Diseño de los campos.
const gridSx = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
  },
} as const;

// Componente visual para organizar el formulario.
const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <Box
    sx={{
      border: 1,
      borderColor: 'divider',
      borderRadius: 1,
      overflow: 'hidden',
    }}
  >
    <Typography
      sx={{
        px: 2,
        py: 1.25,
        fontWeight: 700,
        fontSize: 14,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
      }}
    >
      {title}
    </Typography>

    <Box sx={{ p: 2 }}>{children}</Box>
  </Box>
);

// Formulario de creación y edición de usuarios.
export const UserFormDialog = ({
  open,
  user,
  onClose,
  onSaved,
}: UserFormDialogProps) => {
  const isEdit = Boolean(user);
  const notify = useNotify();

  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(
      buildUserSchema(isEdit ? 'edit' : 'create'),
    ),
    defaultValues: EMPTY,
  });

  // Cargar los datos al abrir el formulario.
  useEffect(() => {
    if (!open) return;

    if (user) {
      reset({
        ...EMPTY,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        active: user.active,
      });
    } else {
      reset({ ...EMPTY });
    }
  }, [open, user, reset]);

  // Guardar usuario.
  const onSubmit = async (values: UserFormValues) => {
    setSubmitting(true);

    try {
      // Datos compatibles con el servicio actual.
      const base: UserPayload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        role: values.role as Role,
        active: values.active,

        // Campos heredados no persistidos.
        dni: '',
        phone: null,
        username: '',
        courseIds: [],
      };

      if (isEdit && user) {
        // Editar sin modificar contraseña.
        await updateUser(user.id, base);

        notify.success(
          'Usuario actualizado correctamente',
        );
      } else {
        // Crear usuario con contraseña.
        await createUser({
          ...base,
          password: values.password,
        });

        notify.success(
          'Usuario creado correctamente',
        );
      }

      onSaved();
      onClose();
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 409
      ) {
        const field = (
          error.details as { field?: string } | undefined
        )?.field;

        if (field === 'email') {
          setError('email', {
            message: UNIQUE_MESSAGES.email,
          });
        } else {
          notify.error(error.message);
        }
      } else {
        notify.error(
          error instanceof Error
            ? error.message
            : 'No se pudo guardar el usuario',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        style={{ display: 'contents' }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isEdit ? 'Editar usuario' : 'Nuevo usuario'}

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {isEdit
              ? 'Modificá los datos y permisos del usuario.'
              : 'Completá los datos para crear un nuevo acceso al sistema NOTAR.'}
          </Typography>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* DATOS PERSONALES */}
          <Section title="Datos personales">
            <Box sx={gridSx}>
              <TextField
                label="Nombre"
                placeholder="Ej: María"
                autoFocus
                fullWidth
                {...register('firstName')}
                error={Boolean(errors.firstName)}
                helperText={errors.firstName?.message}
              />

              <TextField
                label="Apellido"
                placeholder="Ej: González"
                fullWidth
                {...register('lastName')}
                error={Boolean(errors.lastName)}
                helperText={errors.lastName?.message}
              />

              <TextField
                label="Correo electrónico"
                type="email"
                placeholder="correo@escuela.edu"
                fullWidth
                sx={{
                  gridColumn: {
                    sm: 'span 2',
                  },
                }}
                {...register('email')}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
            </Box>
          </Section>

          {/* DATOS DE ACCESO */}
          <Section title="Datos de acceso">
            <Box sx={gridSx}>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    fullWidth
                    label="Rol del usuario"
                    {...field}
                    error={Boolean(errors.role)}
                    helperText={errors.role?.message}
                    sx={{
                      gridColumn: {
                        sm: 'span 2',
                      },
                    }}
                  >
                    {ROLES.map((role) => (
                      <MenuItem
                        key={role}
                        value={role}
                      >
                        {ROLE_LABELS[role]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              {/* La contraseña solo se configura al crear. */}
              {!isEdit && (
                <>
                  <TextField
                    label="Contraseña"
                    type="password"
                    autoComplete="new-password"
                    placeholder={`Mínimo ${PASSWORD_MIN} caracteres`}
                    fullWidth
                    {...register('password')}
                    error={Boolean(errors.password)}
                    helperText={errors.password?.message}
                  />

                  <TextField
                    label="Confirmar contraseña"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repetir contraseña"
                    fullWidth
                    {...register('confirmPassword')}
                    error={Boolean(
                      errors.confirmPassword,
                    )}
                    helperText={
                      errors.confirmPassword?.message
                    }
                  />
                </>
              )}

              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    sx={{
                      gridColumn: {
                        sm: 'span 2',
                      },
                    }}
                    label="Usuario activo"
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={(event) =>
                          field.onChange(
                            event.target.checked,
                          )
                        }
                      />
                    }
                  />
                )}
              />
            </Box>
          </Section>

          {/* AVISO INFORMATIVO */}
          <Alert severity="info">
            Los permisos de acceso dependen del rol
            seleccionado. Las asignaciones de cursos
            y materias se gestionarán por separado.
          </Alert>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
          }}
        >
          <Button
            onClick={onClose}
            disabled={submitting}
            color="inherit"
            variant="outlined"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress
                  size={16}
                  color="inherit"
                />
              ) : undefined
            }
            sx={{
              bgcolor: '#111827',
              '&:hover': {
                bgcolor: '#1f2937',
              },
            }}
          >
            {submitting
              ? 'Guardando...'
              : isEdit
                ? 'Guardar cambios'
                : 'Crear usuario'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
