import { useEffect, useState } from 'react';

interface ResourceState<T> {
  baseKey: string;
  requestKey: string;
  data?: T;
  error?: string;
}

export interface LazyResource<T> {
  data: T | undefined;
  loading: boolean;
  error: string | undefined;
  reload: () => void;
}

// Fetches data only when `key` is not null (e.g. the first time a tab is opened).
// Changing the key or calling reload() fetches again and aborts the previous request.
// While reloading the same resource, the previous data stays visible.
export function useLazyResource<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
): LazyResource<T> {
  const [reloadCount, setReloadCount] = useState(0);
  const [state, setState] = useState<ResourceState<T> | null>(null);

  const requestKey = key === null ? null : `${key}:${reloadCount}`;

  useEffect(() => {
    if (key === null || requestKey === null) return;
    const controller = new AbortController();

    fetcher(controller.signal)
      .then((data) => setState({ baseKey: key, requestKey, data }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Error inesperado';
        setState({ baseKey: key, requestKey, error: message });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const isCurrent = state !== null && state.requestKey === requestKey;

  return {
    data: state && key !== null && state.baseKey === key ? state.data : undefined,
    loading: requestKey !== null && !isCurrent,
    error: state && isCurrent ? state.error : undefined,
    reload: () => setReloadCount((prev) => prev + 1),
  };
}