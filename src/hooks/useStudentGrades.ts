import { useEffect, useState } from 'react';
import { getGradesByStudent, type StudentSubjectRow } from '@/services/grades.service';

interface UseStudentGradesResult {
  rows: StudentSubjectRow[];
  loading: boolean;
  error: string | undefined;
}

export function useStudentGrades(
  studentId: string,
  year: number | undefined,
): UseStudentGradesResult {
  const [rows, setRows] = useState<StudentSubjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!studentId || !year) {
      setRows([]);
      setError(undefined);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(undefined);

    getGradesByStudent(studentId, year, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setRows(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Error inesperado');
        setLoading(false);
      });

    return () => controller.abort();
  }, [studentId, year]);

  return { rows, loading, error };
}