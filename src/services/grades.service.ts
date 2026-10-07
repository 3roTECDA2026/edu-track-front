import { fetchApi } from '@/services/api';

export type ScoreSlot = number | null;

export interface RosterStudent {
  id: string;
  dni: string;
  lastName: string;
  firstName: string;
}

export interface RosterGrade {
  id: string;
  term1Scores: ScoreSlot[] | null;
  term2Scores: ScoreSlot[] | null;
  term1Score: number | null;
  term2Score: number | null;
  finalScore: number | null;
  subjectStatus: string;
  term1Closed: boolean;
  term2Closed: boolean;
}

export interface RosterRow {
  id: string; // enrollmentId
  student: RosterStudent;
  subject: { id: string; name: string };
  grade: RosterGrade | null;
}

export interface RosterParams {
  classSectionId: string;
  subjectId: string;
  year: number;
}
// GET /api/grades
export function getGradeRoster(params: RosterParams, signal?: AbortSignal) {
  const query = new URLSearchParams({
    classSectionId: params.classSectionId,
    subjectId: params.subjectId,
    year: String(params.year),
  });
  return fetchApi<RosterRow[]>(`/api/grades/roster?${query.toString()}`, { signal });
}


export interface SaveGradeInput {
  enrollmentId: string;
  term1Scores?: ScoreSlot[];
  term2Scores?: ScoreSlot[];
}

// POST /api/grades
export function saveGrade(input: SaveGradeInput) {
  const { enrollmentId, ...scores } = input;
  return fetchApi<RosterGrade>('/api/grades', {
    method: 'POST',
    body: JSON.stringify({ enrollmentId, ...scores }),
  });
}


export interface StudentSubjectRow {
  id: string; // enrollmentId
  subject: { id: string; name: string };
  grade: RosterGrade | null;
}

// GET /api/grades/by-student?studentId=&year=
export function getGradesByStudent(studentId: string, year: number, signal?: AbortSignal) {
  const query = new URLSearchParams({ studentId, year: String(year) });
  return fetchApi<StudentSubjectRow[]>(`/api/grades/by-student?${query.toString()}`, { signal });
}