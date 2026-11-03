import { useCallback, useEffect, useState } from 'react';

import {
  getInstitutionalConfig,
  updateInstitutionalConfig,
  type InstitutionalConfig,
  type UpdateInstitutionalConfigInput,
} from '@/services/institutionalConfig.service';

interface UseInstitutionalConfigResult {
  config: InstitutionalConfig | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  save: (input: UpdateInstitutionalConfigInput) => Promise<boolean>;
}

export function useInstitutionalConfig(): UseInstitutionalConfigResult {
  const [config, setConfig] = useState<InstitutionalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getInstitutionalConfig()
      .then((data) => {
        if (!active) return;
        setConfig(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Error inesperado');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(
    async (input: UpdateInstitutionalConfigInput): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const updated = await updateInstitutionalConfig(input);
        setConfig(updated);
        setSaving(false);
        return true;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al guardar');
        setSaving(false);
        return false;
      }
    },
    [],
  );

  return { config, loading, error, saving, save };
}