import { fetchApi } from '@/services/api';

export interface SubjectOption {
  id: string;
  name: string;
  gradeLevel: number;
  // El back también devuelve estos datos; los usa la pestaña de Materias
  code?: string;
  hoursPerWeek?: number;
  area?: string;
}


export function getSubjects(signal?: AbortSignal) {
    // Las materias están montadas dentro del router de cursos en el back (/api/courses/subjects)
  return fetchApi<SubjectOption[]>('/api/courses/subjects', { signal });
}