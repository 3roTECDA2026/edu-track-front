import { useState } from 'react';
import { saveGrade, type SaveGradeInput } from '@/services/grades.service';

interface UseSaveGradesResult {
  save: (inputs: SaveGradeInput[]) => Promise<boolean>;
  saving: boolean;
  error: string | undefined;
}

export function useSaveGrades(): UseSaveGradesResult {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  async function save(inputs: SaveGradeInput[]): Promise<boolean> {
    setSaving(true);
    setError(undefined);
    try {
      
      await Promise.all(inputs.map((input) => saveGrade(input)));
      setSaving(false);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setSaving(false);
      return false;
    }
  }

  return { save, saving, error };
}