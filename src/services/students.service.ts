import { fetchApi } from '@/services/api';

export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFER_OUT' | 'CONDITIONAL';
export type Shift = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'EXTRA_TIME';
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
  dateOfBirth: string; // "YYYY-MM-DD"
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

export function getStudents(params: StudentListParams, signal?: AbortSignal) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search) query.set('search', params.search);
  if (params.grade) query.set('grade', params.grade);
  if (params.division) query.set('division', params.division);
  if (params.shift) query.set('shift', params.shift);

  // "active" is the backend default (ACTIVE + CONDITIONAL), so it sends nothing.
  if (params.status === 'inactive') query.set('status', 'INACTIVE');
  if (params.status === 'all') query.set('status', 'all');

  return fetchApi<PaginatedResponse<StudentListItem>>(`/api/students?${query.toString()}`, { signal });
}

export function deactivateStudent(id: string) {
  return fetchApi<Pick<StudentListItem, 'id' | 'status'>>(`/api/students/${id}/deactivate`, {
    method: 'PATCH',
  });
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