import { fetchApi } from '@/services/api';
import type { TeacherSummary } from '@/services/teacherAssignments.service';

// TODO(TECH-034): reemplazar por el endpoint real de usuarios (GET /api/users?role=TEACHER)
// cuando el back de usuarios llegue a develop. Es lo único que hay que cambiar.
export const listTeachers = (signal?: AbortSignal) =>
  fetchApi<TeacherSummary[]>('/api/teacher-assignments/teachers', { signal });
