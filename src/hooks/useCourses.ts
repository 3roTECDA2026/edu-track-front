import { useEffect, useState } from 'react';
import { listCourses, type CourseOption } from '@/services/courses.service';

// Carga los cursos una sola vez, la primera vez que `enabled` pasa a true
export const useCourses = (enabled: boolean) => {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || loaded) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listCourses(controller.signal)
      .then((data) => {
        setCourses(data);
        setLoaded(true);
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [enabled, loaded]);

  return { courses, loading, error };
};