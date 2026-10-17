import { fetchApi } from '@/services/api';
import type { TeacherSummary } from '@/services/teacherAssignments.service';

interface UsersResponse {
  data: {
    items: Array<TeacherSummary & { status: string }>;
    pagination: { page: number; totalPages: number };
  };
}

const PAGE_SIZE = 25;

// Solo usuarios con rol docente y estado activo, de todas las páginas.
// Nota: /api/users exige token y rol ADMINISTRATOR.
export async function listTeachers(signal?: AbortSignal): Promise<TeacherSummary[]> {
  const teachers: TeacherSummary[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const params = new URLSearchParams({ role: 'TEACHER', page: String(page), limit: String(PAGE_SIZE) });
    const body = await fetchApi<UsersResponse>(`/api/users?${params.toString()}`, { signal });

    for (const u of body.data.items) {
      if (u.status === 'ACTIVE') {
        teachers.push({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email });
      }
    }

    totalPages = body.data.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);

  return teachers.sort(
    (a, b) => a.lastName.localeCompare(b.lastName, 'es') || a.firstName.localeCompare(b.firstName, 'es'),
  );
}