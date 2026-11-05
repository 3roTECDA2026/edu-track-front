import { useEffect, useState } from 'react';
import { listTeachers } from '@/services/teachers.service';
import type { TeacherSummary } from '@/services/teacherAssignments.service';
import { getLoadErrorMessage } from '@/components/teacherAssignments/teacherAssignmentLabels';

interface UseTeachersResult {
  teachers: TeacherSummary[];
  loading: boolean;
  error: string | undefined;
}

export function useTeachers(): UseTeachersResult {
  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();

    listTeachers(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setTeachers(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(getLoadErrorMessage(err, 'los docentes'));
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { teachers, loading, error };
}
