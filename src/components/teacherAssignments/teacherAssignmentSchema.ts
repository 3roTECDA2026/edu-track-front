import { z } from 'zod';

export const teacherAssignmentSchema = z.object({
  teacherId: z.string().min(1, 'Seleccioná un docente'),
  subjectId: z.string().min(1, 'Seleccioná una materia'),
  classSectionId: z.string().min(1, 'Seleccioná un curso'),
});

export type TeacherAssignmentFormValues = z.infer<typeof teacherAssignmentSchema>;
