import { fetchApi } from '@/services/api';

export type OrganizationalModel = 'OPTION_A' | 'OPTION_B' | 'OPTION_C' | 'OPTION_D';

// Lo que devuelve el back (le agrega el flag calculado minimumPeriodMet)
export interface InstitutionalConfig {
  id: string;
  organizationalModel: OrganizationalModel;
  adoptedAt: string; // fecha ISO: desde cuándo rige
  minimumExpiryDate: string; // fecha ISO: vencimiento del plazo mínimo (3 ciclos)
  minimumPeriodMet: boolean; // true cuando ya se cumplió el plazo -> dispara la alerta
  createdAt: string;
}

export interface UpdateInstitutionalConfigInput {
  organizationalModel: OrganizationalModel;
  adoptedAt?: string; // opcional; si no va, el back usa hoy
}

// GET: config vigente o null si todavía no se configuró
export async function getInstitutionalConfig(): Promise<InstitutionalConfig | null> {
  const res = await fetchApi<{ data: InstitutionalConfig | null }>('/api/institutional-config');
  return res.data;
}

// PUT: setea o actualiza el modelo organizativo
export async function updateInstitutionalConfig(
  input: UpdateInstitutionalConfigInput,
): Promise<InstitutionalConfig> {
  const res = await fetchApi<{ data: InstitutionalConfig }>('/api/institutional-config', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return res.data;
}