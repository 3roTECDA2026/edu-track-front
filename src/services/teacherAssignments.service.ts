import { fetchApi } from '@/services/api';

export { ApiError } from '@/services/api';

export type Shift = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'EXTRA_TIME';

export interface TeacherSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Forma que devuelve el back (teacherAssignmentSelect): ya viene con docente, materia y curso
export interface TeacherAssignment {
  id: string;
  createdAt: string;
  teacherId: string;
  subjectId: string;
  classSectionId: string;
  teacher: TeacherSummary;
  subject: { id: string; name: string; code: string; hoursPerWeek: number; area: string };
  classSection: {
    id: string;
    grade: number;
    division: string;
    shift: Shift;
    academicYear: { id: string; year: number };
  };
}

export interface TeacherAssignmentPayload {
  teacherId: string;
  subjectId: string;
  classSectionId: string;
}

const BASE_PATH = '/api/teacher-assignments';

export const listTeacherAssignments = (signal?: AbortSignal) =>
  fetchApi<TeacherAssignment[]>(BASE_PATH, { signal });

export const createTeacherAssignment = (payload: TeacherAssignmentPayload) =>
  fetchApi<TeacherAssignment>(BASE_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// Cambiar docente, materia o curso equivale a quitar la asignación y crear otra,
// por eso no hay update en el front.
export const deleteTeacherAssignment = (id: string) =>
  fetchApi<unknown>(`${BASE_PATH}/${id}`, { method: 'DELETE' });
