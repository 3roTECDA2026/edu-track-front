import { fetchApi } from '@/services/api';
import type { Shift, StudentDetail } from '@/services/students.service';

export type AttendanceValue = 'PRESENT' | 'ABSENT' | 'HALF' | 'QUARTER';
export type PreliminaryAssessment = 'TEA' | 'TEP' | 'TED';
export type SubjectStatus =
  | 'IN_PROGRESS'
  | 'APPROVED_ACCREDITED'
  | 'PENDING_1ST_TERM'
  | 'PENDING_2ND_TERM'
  | 'IN_INTENSIFICATION'
  | 'CONTINUES_INTENSIFYING'
  | 'MPAA';

export interface EnrollmentHistoryItem {
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

export interface StudentGrade {
  id: string;
  preliminaryAssessment1: PreliminaryAssessment | null;
  term1Score: number | null;
  preliminaryAssessment2: PreliminaryAssessment | null;
  term2Score: number | null;
  finalScore: number | null;
  subjectStatus: SubjectStatus;
  enrollment: {
    id: string;
    subject: { id: string; name: string };
    academicYear: { id: string; year: number };
  };
}

export interface AttendanceRecord {
  id: string;
  date: string;
  value: AttendanceValue;
  justified: boolean;
  justification: string | null;
}

interface GradesResponse {
  data: StudentGrade[];
  total: number;
  page: number;
  totalPages: number;
}

interface AttendanceResponse {
  items: AttendanceRecord[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export function getStudentById(id: string, signal?: AbortSignal) {
  return fetchApi<StudentDetail>(`/api/students/${id}`, { signal });
}

export function getStudentHistory(id: string, signal?: AbortSignal) {
  return fetchApi<EnrollmentHistoryItem[]>(`/api/students/${id}/history`, { signal });
}

export async function getStudentGrades(studentId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ studentId, limit: '100' });
  const response = await fetchApi<GradesResponse>(`/api/grades?${query.toString()}`, { signal });
  return response.data;
}

// El endpoint de asistencia devuelve como máximo 100 registros por página
// y un año escolar tiene más días, así que se piden todas las páginas.
const ATTENDANCE_PAGE_SIZE = 100;

export async function getStudentAttendance(studentId: string, year: number | undefined, signal?: AbortSignal) {
  const records: AttendanceRecord[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const query = new URLSearchParams({
      studentId,
      page: String(page),
      pageSize: String(ATTENDANCE_PAGE_SIZE),
    });
    if (year) {
      query.set('from', `${year}-01-01`);
      query.set('to', `${year}-12-31`);
    }

    const response = await fetchApi<AttendanceResponse>(`/api/attendance?${query.toString()}`, { signal });
    records.push(...response.items);
    totalPages = response.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);

  return records;
}