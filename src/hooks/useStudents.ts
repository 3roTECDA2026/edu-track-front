import { useEffect, useState } from 'react';
import {
  getStudents,
  type PaginatedResponse,
  type StudentListItem,
  type StudentListParams,
} from '@/services/students.service';

interface UseStudentsResult {
  data: PaginatedResponse<StudentListItem> | undefined;
  loading: boolean;
  error: string | undefined;
  reload: () => void;
}

// Reusable hook for fetching the paginated student list.
// Aborts the previous request when params change before it resolves,
// and exposes reload() to refetch without changing any param
// (e.g. after deactivating a student).
export function useStudents(params: StudentListParams): UseStudentsResult {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<{
    key: string;
    data?: PaginatedResponse<StudentListItem>;
    error?: string;
  }>({ key: '' });

  const requestKey = JSON.stringify(params) + `:${reloadKey}`;

  useEffect(() => {
    const controller = new AbortController();

    getStudents(params, controller.signal)
      .then((data) => setState({ key: requestKey, data }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Error inesperado';
        setState({ key: requestKey, error: message });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const loading = state.key !== requestKey;

  return {
    data: loading ? undefined : state.data,
    loading,
    error: loading ? undefined : state.error,
    reload: () => setReloadKey((prev) => prev + 1),
  };
}