import { fetchApi } from '@/services/api';
import type { ClassSectionOption } from '@/services/students.service';
import { SHIFT_LABELS } from '@/components/students/studentLabels';

export interface CourseOption {
  id: string;
  label: string; // ej: "1º Año — Sección A — Mañana"
}

// En el backend los "cursos" son las divisiones (class-sections) de un ciclo lectivo.
export async function listCourses(signal?: AbortSignal): Promise<CourseOption[]> {
  const sections = await fetchApi<ClassSectionOption[]>('/api/class-sections', { signal });

  return sections.map((section) => ({
    id: section.id,
    label: `${section.grade}º Año — Sección ${section.division} — ${SHIFT_LABELS[section.shift]}`,
  }));
}
