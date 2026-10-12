import { fetchApi } from '@/services/api';

export interface SubjectOption {
  id: string;
  name: string;
  gradeLevel: number;
}


export function getSubjects(signal?: AbortSignal) {
  return fetchApi<SubjectOption[]>('/api/subjects', { signal });
}