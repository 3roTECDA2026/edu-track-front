import { useCallback, useEffect, useState } from 'react';
import { listTeacherAssignments, type TeacherAssignment } from '@/services/teacherAssignments.service';

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
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return { assignments, loading, error, reload };
};
