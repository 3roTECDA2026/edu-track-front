import { useCallback, useEffect, useState } from 'react';
import { listUsers, type Role, type UserListItem } from '@/services/users.service';
import { useDebounce } from './useDebounce';

export const useUsers = () => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // MUI TablePagination usa página base 0; la API usa base 1
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [active, setActive] = useState<'true' | 'false' | ''>('');
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebounce(search, 400);

  // Al cambiar cualquier filtro volvemos a la primera página
  useEffect(() => setPage(0), [debouncedSearch, role, active, rowsPerPage]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listUsers(
      { page: page + 1, limit: rowsPerPage, search: debouncedSearch.trim(), role, active },
      controller.signal,
    )
      .then(({ items, total }) => {
        setUsers(items);
        setTotal(total);
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, rowsPerPage, debouncedSearch, role, active, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return {
    users,
    total,
    loading,
    error,
    reload,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    search,
    setSearch,
    role,
    setRole,
    active,
    setActive,
  };
};