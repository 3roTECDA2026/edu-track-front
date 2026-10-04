import { useCallback, useEffect, useState } from 'react';
import { getGradeRoster, type RosterRow } from '@/services/grades.service';

interface UseGradeRosterResult {
  roster: RosterRow[];
  loading: boolean;
  error: string | undefined;
  refetch: () => void;
}

export function useGradeRoster(
  classSectionId: string,
  subjectId: string,
  year: number | undefined,
): UseGradeRosterResult {
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    // Sin los 3 filtros no hay nada que pedir
    if (!classSectionId || !subjectId || !year) {
      setRoster([]);
      setError(undefined);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(undefined);

    getGradeRoster({ classSectionId, subjectId, year }, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setRoster(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Error inesperado');
        setLoading(false);
      });

    return () => controller.abort();
  }, [classSectionId, subjectId, year, reloadKey]);

  return { roster, loading, error, refetch };
}