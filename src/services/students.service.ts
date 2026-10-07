import { fetchApi } from '@/services/api';

export type StudentStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'GRADUATED'
  | 'TRANSFER_OUT'
  | 'CONDITIONAL';

export type Shift =
  | 'MORNING'
  | 'AFTERNOON'
  | 'EVENING'
  | 'EXTRA_TIME';

export type StatusFilter = 'active' | 'inactive' | 'all';

export interface CurrentSection {
  year: number;
  grade: number;
  division: string;
  shift: Shift;
}

export interface StudentListItem {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  recordNumber: string;
  status: StudentStatus;
  currentSection: CurrentSection | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface StudentListParams {
  page: number;
  limit: number;
  search: string;
  grade: string;
  division: string;
  shift: string;
  status: StatusFilter;
}

export interface Guardian {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dni: string | null;
  relationship: string | null;
  isPrimary: boolean;
}

export interface StudentDetail {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  address: string;
  city: string;
  phone: string;
  recordNumber: string;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
  currentSection: CurrentSection | null;
  guardians: Guardian[];
}

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  dni: string;
  dateOfBirth: string;
  placeOfBirth: string;
  address: string;
  city: string;
  phone: string;
  classSectionId: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianDni?: string;
  guardianRelationship?: string;
}

export interface ClassSectionOption {
  id: string;
  year: number;
  grade: number;
  division: string;
  shift: Shift;
}

// Datos que se pueden editar (PATCH /students/:id).
export interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  dni?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  address?: string;
  city?: string;
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianDni?: string;
  guardianRelationship?: string;
}

// Registro que devuelve GET /api/students/:id/history
export interface StudentTrajectoryRecord {
  id: string;
  year: number;
  grade: number;
  division: string;
  section: string;
  shift: Shift;
  startDate: string;
  endDate: string | null;
  leaveReason: string | null;
}

export function getStudents(
  params: StudentListParams,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search) {
    query.set('search', params.search);
  }

  if (params.grade) {
    query.set('grade', params.grade);
  }

  if (params.division) {
    query.set('division', params.division);
  }

  if (params.shift) {
    query.set('shift', params.shift);
  }

  // "active" es el valor por defecto del backend
  // (ACTIVE + CONDITIONAL).
  if (params.status === 'inactive') {
    query.set('status', 'INACTIVE');
  }

  if (params.status === 'all') {
    query.set('status', 'all');
  }

  return fetchApi<PaginatedResponse<StudentListItem>>(
    `/api/students?${query.toString()}`,
    { signal },
  );
}

export function deactivateStudent(id: string) {
  return fetchApi<Pick<StudentListItem, 'id' | 'status'>>(
    `/api/students/${id}/deactivate`,
    {
      method: 'PATCH',
    },
  );
}

export function createStudent(data: CreateStudentInput) {
  return fetchApi<StudentDetail>('/api/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getClassSections() {
  return fetchApi<ClassSectionOption[]>('/api/class-sections');
}

export function getStudent(
  id: string,
  signal?: AbortSignal,
) {
  return fetchApi<StudentDetail>(
    `/api/students/${id}`,
    { signal },
  );
}

export function updateStudent(
  id: string,
  data: UpdateStudentInput,
) {
  return fetchApi<StudentDetail>(
    `/api/students/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );
}

export function getStudentTrajectory(
  id: string,
  signal?: AbortSignal,
) {
  return fetchApi<StudentTrajectoryRecord[]>(
    `/api/students/${id}/history`,
    { signal },
  );
}