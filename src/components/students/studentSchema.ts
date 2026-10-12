import { z } from 'zod';

const dniRegex = /^\d{7,8}$/;
const phoneRegex = /^[\d\s()+-]{6,20}$/;

export const studentSchema = z.object({
  lastName: z.string().trim().min(1, 'El apellido es obligatorio').max(100, 'Máximo 100 caracteres'),
  firstName: z.string().trim().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
  dni: z.string().trim().regex(dniRegex, 'Ingresá 7 u 8 dígitos, sin puntos'),
  dateOfBirth: z.string().trim().min(1, 'La fecha de nacimiento es obligatoria'),
  placeOfBirth: z.string().trim().min(1, 'El lugar de nacimiento es obligatorio').max(150, 'Máximo 150 caracteres'),
  address: z.string().trim().min(1, 'El domicilio es obligatorio').max(200, 'Máximo 200 caracteres'),
  city: z.string().trim().min(1, 'La localidad es obligatoria').max(100, 'Máximo 100 caracteres'),
  phone: z.string().trim().regex(phoneRegex, 'Teléfono inválido'),
  guardianName: z.string().trim().min(1, 'El nombre del adulto responsable es obligatorio').max(150, 'Máximo 150 caracteres'),
  guardianPhone: z.string().trim().regex(phoneRegex, 'Teléfono inválido'),
  guardianEmail: z.string().trim().min(1, 'El email es obligatorio').email('Email inválido'),
  guardianDni: z.string().trim().refine((v) => v === '' || dniRegex.test(v), 'Ingresá 7 u 8 dígitos, sin puntos'),
  guardianRelationship: z.string().trim().max(50, 'Máximo 50 caracteres'),
  grade: z.string().min(1, 'Seleccioná un curso'),
  division: z.string().min(1, 'Seleccioná una sección'),
  shift: z.string().min(1, 'Seleccioná un turno'),
});

// En edición la inscripción no se modifica, así que esos campos no se validan.
export const studentEditSchema = studentSchema.extend({
  grade: z.string(),
  division: z.string(),
  shift: z.string(),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

export const EMPTY_STUDENT_FORM: StudentFormValues = {
  lastName: '',
  firstName: '',
  dni: '',
  dateOfBirth: '',
  placeOfBirth: '',
  address: '',
  city: '',
  phone: '',
  guardianName: '',
  guardianPhone: '',
  guardianEmail: '',
  guardianDni: '',
  guardianRelationship: '',
  grade: '',
  division: '',
  shift: '',
};

// Backend Zod field -> nuestro campo de form. classSectionId no existe como campo propio,
// así que su error se muestra en "shift" (último select de la cadena año/sección/turno).
export const BACKEND_FIELD_MAP: Record<string, keyof StudentFormValues> = {
  firstName: 'firstName',
  lastName: 'lastName',
  dni: 'dni',
  dateOfBirth: 'dateOfBirth',
  placeOfBirth: 'placeOfBirth',
  address: 'address',
  city: 'city',
  phone: 'phone',
  classSectionId: 'shift',
  guardianName: 'guardianName',
  guardianPhone: 'guardianPhone',
  guardianEmail: 'guardianEmail',
  guardianDni: 'guardianDni',
  guardianRelationship: 'guardianRelationship',
};