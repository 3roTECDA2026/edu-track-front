export interface StudentFormValues {
  lastName: string;
  firstName: string;
  dni: string;
  dateOfBirth: string;
  placeOfBirth: string;
  address: string;
  city: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianDni: string;
  guardianRelationship: string;
  grade: string;
  division: string;
  shift: string;
}

export type FormErrors = Partial<Record<keyof StudentFormValues, string>>;

const DNI_REGEX = /^\d{7,8}$/;
const PHONE_REGEX = /^\d{6,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateStudentForm(values: StudentFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.lastName.trim()) errors.lastName = 'El apellido es obligatorio';
  if (!values.firstName.trim()) errors.firstName = 'El nombre es obligatorio';

  if (!values.dni.trim()) errors.dni = 'El DNI es obligatorio';
  else if (!DNI_REGEX.test(values.dni.trim())) errors.dni = 'El DNI debe tener 7 u 8 números';

  if (!values.dateOfBirth) errors.dateOfBirth = 'La fecha de nacimiento es obligatoria';
  if (!values.placeOfBirth.trim()) errors.placeOfBirth = 'El lugar de nacimiento es obligatorio';
  if (!values.address.trim()) errors.address = 'El domicilio es obligatorio';
  if (!values.city.trim()) errors.city = 'La localidad es obligatoria';

  if (!values.phone.trim()) errors.phone = 'El teléfono es obligatorio';
  else if (!PHONE_REGEX.test(values.phone.trim())) errors.phone = 'Teléfono inválido (solo números, 6 a 15 dígitos)';

  if (!values.guardianName.trim()) errors.guardianName = 'El nombre del adulto responsable es obligatorio';

  if (!values.guardianPhone.trim()) errors.guardianPhone = 'El teléfono es obligatorio';
  else if (!PHONE_REGEX.test(values.guardianPhone.trim())) errors.guardianPhone = 'Teléfono inválido';

  if (!values.guardianEmail.trim()) errors.guardianEmail = 'El email es obligatorio';
  else if (!EMAIL_REGEX.test(values.guardianEmail.trim())) errors.guardianEmail = 'Formato de email inválido';

  if (values.guardianDni.trim() && !DNI_REGEX.test(values.guardianDni.trim())) {
    errors.guardianDni = 'El DNI debe tener 7 u 8 números';
  }

  if (!values.grade) errors.grade = 'Seleccioná un curso';
  if (!values.division) errors.division = 'Seleccioná una sección';
  if (!values.shift) errors.shift = 'Seleccioná un turno';

  return errors;
}

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