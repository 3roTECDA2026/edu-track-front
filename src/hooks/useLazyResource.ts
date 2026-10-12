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

// Trae los datos solo cuando `key` no es null (por ejemplo, la primera vez que se abre un tab).
// Si cambia la key o se llama a reload(), vuelve a pedir los datos y cancela el pedido anterior.
// Mientras se recarga el mismo recurso, se siguen mostrando los datos anteriores.
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