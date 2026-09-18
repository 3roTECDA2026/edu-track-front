export type JustificationRecord = {
  id: number;
  date: string;
  type: 'ausente' | 'media' | 'cuarto';
  reason: string;
};

export type AttendanceRecord = {
  id: number;
  student: string;
  dni: string;
  course: string;
  date: string;
  absences: number;
  halfAbsences: number;
  quarterAbsences: number;
  justifications: JustificationRecord[];
};

export type AttendanceFilters = {
  course: string;
  from: string;
  to: string;
  search: string;
};
