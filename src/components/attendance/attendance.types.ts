export type JustificationRecord = {
  id: number;
  date: string;
  type: 'ausente' | 'media' | 'cuarto';
  reason: string;
};

export type AttendanceRecord = {
  id: number;
  sectionId?: string;
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

export type AttendanceSummaryResponse = {
  items: Array<{
    studentId: string;
    student: string;
    dni: string;
    sectionId: string;
    course: string;
    date: string;
    absences: number;
    halfAbsences: number;
    quarterAbsences: number;
    total: number;
    justified: number;
    unjustified: number;
    justifications: JustificationRecord[];
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
