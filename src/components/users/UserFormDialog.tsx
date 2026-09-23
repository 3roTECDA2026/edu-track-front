import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useNotify } from '@/components/layout/NotificationProvider';
import {
  ApiError,
  ROLES,
  createUser,
  updateUser,
  type Role,
  type UserListItem,
} from '@/services/users.service';
import { ROLE_LABELS } from './userLabels';
import { PASSWORD_MIN, buildUserSchema, type UserFormValues } from './userSchemas';

interface UserFormDialogProps {
  open: boolean;
  user: UserListItem | null; // null = crear, usuario = editar
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY: UserFormValues = { name: '', email: '', role: '', password: '', confirmPassword: '' };

export const UserFormDialog = ({ open, user, onClose, onSaved }: UserFormDialogProps) => {
  const isEdit = !!user;
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
    resolver: zodResolver(buildUserSchema(isEdit ? 'edit' : 'create')),
    defaultValues: EMPTY,
  });

  // Cada vez que se abre, cargamos los datos del usuario (o el form vacío)
  useEffect(() => {
    if (open) {
      reset(user ? { ...EMPTY, name: user.name, email: user.email, role: user.role } : EMPTY);
    }
  }, [open, user, reset]);

  const onSubmit = async (values: UserFormValues) => {
    setSubmitting(true);
    try {
      const base = {
        name: values.name.trim(),
        email: values.email.trim(),
        role: values.role as Role,
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
        // Email duplicado: lo mostramos en el campo
        setError('email', { message: 'Ya existe un usuario con este email' });
      } else {
        notify.error(e instanceof Error ? e.message : 'No se pudo guardar el usuario');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Nombre completo"
              placeholder="Ej: María González"
              autoFocus
              fullWidth
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              label="Email"
              type="email"
              placeholder="correo@escuela.edu"
              fullWidth
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  label="Rol"
                  fullWidth
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
            <TextField
              label={isEdit ? 'Nueva contraseña' : 'Contraseña'}
              type="password"
              autoComplete="new-password"
              placeholder={`Mínimo ${PASSWORD_MIN} caracteres`}
              fullWidth
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message ?? (isEdit ? 'Dejala vacía para no cambiarla' : undefined)}
            />
            <TextField
              label="Confirmar contraseña"
              type="password"
              autoComplete="new-password"
              fullWidth
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
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