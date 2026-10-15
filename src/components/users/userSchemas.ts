
import { z } from 'zod';
import { ROLES, type Role } from '@/services/users.service';

// Contraseña mínima para crear usuarios.
export const PASSWORD_MIN = 8;

// Modos del formulario.
export type UserFormMode = 'create' | 'edit';

// Esquema de validación de usuarios.
export const buildUserSchema = (mode: UserFormMode) =>
  z
    .object({
      // Nombre
      firstName: z
        .string()
        .trim()
        .min(1, 'El nombre es obligatorio')
        .max(60, 'Máximo 60 caracteres'),

      // Apellido
      lastName: z
        .string()
        .trim()
        .min(1, 'El apellido es obligatorio')
        .max(60, 'Máximo 60 caracteres'),

      // Email
      email: z
        .string()
        .trim()
        .min(1, 'El email es obligatorio')
        .email('Email inválido'),

      // Rol: administrador, docente o preceptor.
      role: z
        .string()
        .refine(
          (value) => ROLES.includes(value as Role),
          'Seleccioná un rol',
        ),

      // Estado del usuario.
      active: z.boolean(),

      // Campos heredados del formulario anterior.
      // Se conservan por compatibilidad con UserFormDialog.
      // Actualmente no se guardan en PostgreSQL.
      dni: z.string(),
      phone: z.string(),
      username: z.string(),
      courseIds: z.array(z.number()),

      // Contraseña.
      password: z.string(),

      // Confirmación de contraseña.
      confirmPassword: z.string(),
    })
    .superRefine((data, ctx) => {
      // En edición no se modifica la contraseña.
      if (mode === 'edit') {
        return;
      }

      // En creación, la contraseña es obligatoria.
      if (data.password.length < PASSWORD_MIN) {
        ctx.addIssue({
          code: 'custom',
          path: ['password'],
          message:
            data.password.length === 0
              ? 'La contraseña es obligatoria'
              : `Mínimo ${PASSWORD_MIN} caracteres`,
        });
      }

      // Validar confirmación de contraseña.
      if (data.confirmPassword.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['confirmPassword'],
          message: 'Confirmá la contraseña',
        });
      } else if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: 'custom',
          path: ['confirmPassword'],
          message: 'Las contraseñas no coinciden',
        });
      }
    });

// Tipo utilizado por React Hook Form.
export type UserFormValues = z.infer<
  ReturnType<typeof buildUserSchema>
>;
