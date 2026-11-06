import { z } from 'zod';
import { ROLES, type Role } from '@/services/users.service';

// Debe coincidir con el mínimo que valida el backend (Zod en POST /users)
export const PASSWORD_MIN = 6;

export type UserFormMode = 'create' | 'edit';

export const buildUserSchema = (mode: UserFormMode) =>
  z
    .object({
      firstName: z.string().trim().min(1, 'El nombre es obligatorio').max(60, 'Máximo 60 caracteres'),
      lastName: z.string().trim().min(1, 'El apellido es obligatorio').max(60, 'Máximo 60 caracteres'),
      dni: z.string().trim().regex(/^\d{7,8}$/, 'Ingresá 7 u 8 dígitos, sin puntos'),
      email: z.string().trim().min(1, 'El email es obligatorio').email('Email inválido'),
      phone: z
        .string()
        .trim()
        .refine((v) => v === '' || /^[\d\s()+-]{6,20}$/.test(v), 'Teléfono inválido'),
      username: z
        .string()
        .trim()
        .min(3, 'Mínimo 3 caracteres')
        .max(30, 'Máximo 30 caracteres')
        .regex(/^[a-zA-Z0-9._-]+$/, 'Solo letras, números, punto, guion y guion bajo'),
      role: z.string().refine((v) => ROLES.includes(v as Role), 'Seleccioná un rol'),
      active: z.boolean(),
      courseIds: z.array(z.number()),
      password: z.string(),
      confirmPassword: z.string(),
    })
    .superRefine((data, ctx) => {
      const { password, confirmPassword } = data;
      // En alta la contraseña es obligatoria; en edición solo si se completa
      const mustValidate = mode === 'create' || password.length > 0 || confirmPassword.length > 0;
      if (!mustValidate) return;

      if (password.length < PASSWORD_MIN) {
        ctx.addIssue({
          code: 'custom',
          path: ['password'],
          message:
            password.length === 0 ? 'La contraseña es obligatoria' : `Mínimo ${PASSWORD_MIN} caracteres`,
        });
      }
      if (confirmPassword.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Confirmá la contraseña' });
      } else if (password !== confirmPassword) {
        ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Las contraseñas no coinciden' });
      }
    });

export type UserFormValues = z.infer<ReturnType<typeof buildUserSchema>>;