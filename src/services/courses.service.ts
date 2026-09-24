import { fetchApi } from './api';

export interface CourseOption {
  id: number;
  label: string; // ej: "1º Año — Sección A — Matemática"
}

// Respuesta esperada: { success, data: CourseOption[] }
export async function listCourses(signal?: AbortSignal): Promise<CourseOption[]> {
  const body = await fetchApi<{ data: CourseOption[] }>('/courses', { signal });
  return body.data;
}