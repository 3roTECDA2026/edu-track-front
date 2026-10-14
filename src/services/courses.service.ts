import { fetchApi } from '@/services/api';

export interface CourseOption {
  id: string;
  year: number;
  grade: number;
  division: string;
  shift: string;
}

export async function listCourses(
  signal?: AbortSignal
): Promise<CourseOption[]> {
  return fetchApi<CourseOption[]>('/api/class-sections', {
    signal,
  });
}