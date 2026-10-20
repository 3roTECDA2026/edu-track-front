import { useCallback, useEffect, useState } from 'react';
import { listTeacherAssignments, type TeacherAssignment } from '@/services/teacherAssignments.service';
import { getLoadErrorMessage } from '@/components/teacherAssignments/teacherAssignmentLabels';

export const useTeacherAssignments = () => {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

   listTeacherAssignments(controller.signal)
      .then(setAssignments)
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === 'AbortError') return;
        setError(getLoadErrorMessage(e, 'las asignaciones'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return { assignments, loading, error, reload };
};
