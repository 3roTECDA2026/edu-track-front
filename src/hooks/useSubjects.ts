import { useEffect, useState } from 'react';
import { getSubjects, type SubjectOption } from '@/services/subjects.service';

interface UseSubjectsResult {
  subjects: SubjectOption[];
  loading: boolean;
  error: string | undefined;
}

export function useSubjects(): UseSubjectsResult {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();

    getSubjects(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setSubjects(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Error inesperado');
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { subjects, loading, error };
}