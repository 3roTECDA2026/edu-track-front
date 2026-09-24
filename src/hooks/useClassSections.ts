import { useEffect, useState } from 'react';
import { getClassSections, type ClassSectionOption } from '@/services/students.service';

interface UseClassSectionsResult {
  sections: ClassSectionOption[];
  loading: boolean;
  error: string | undefined;
}

export function useClassSections(): UseClassSectionsResult {
  const [sections, setSections] = useState<ClassSectionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();

    getClassSections()
      .then((data) => {
        if (controller.signal.aborted) return;
        setSections(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Error inesperado');
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { sections, loading, error };
}