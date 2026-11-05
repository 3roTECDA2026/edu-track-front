import { fetchApi } from '@/services/api';

export interface SubjectOption {
  id: string;
  name: string;
  gradeLevel: number;
}


export function getSubjects(signal?: AbortSignal) {
    // Las materias están montadas dentro del router de cursos en el back (/api/courses/subjects)
  return fetchApi<SubjectOption[]>('/api/courses/subjects', { signal });
}