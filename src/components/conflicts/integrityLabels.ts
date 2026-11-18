import type { SvgIconComponent } from '@mui/icons-material'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined'
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined'

import type {
  IntegrityReason,
  IntegrityStatus,
  SignatureStatus,
} from '@/services/conflicts.service'

// Cómo se muestra el resultado de la verificación de integridad (CRM-093).
// Estándar: blanco y negro; el rojo #dc2626 solo para el error ("Alterado"). Cada estado lleva
// ícono y texto, así se entiende sin distinguir colores.
export const INTEGRITY_STATUS_CONFIG: Record<
  IntegrityStatus,
  { label: string; description: string; color: string; Icon: SvgIconComponent }
> = {
  INTACT: {
    label: 'Íntegro',
    description: 'El contenido coincide con el registrado: no fue alterado.',
    color: '#111827',
    Icon: CheckCircleOutlinedIcon,
  },
  ALTERED: {
    label: 'Alterado',
    description: 'El contenido no coincide con el registrado: fue modificado después de guardarse.',
    color: '#dc2626',
    Icon: ErrorOutlineIcon,
  },
  NOT_HASHED: {
    label: 'Sin hash',
    description: 'Se registró antes de que existiera el hash de integridad: no se puede verificar.',
    color: '#6b7280',
    Icon: HelpOutlineIcon,
  },
}

export const INTEGRITY_REASON_LABELS: Record<IntegrityReason, string> = {
  CONTENT_CHANGED: 'El contenido no coincide con el hash guardado.',
  UNREADABLE: 'El contenido cifrado fue modificado y no se puede leer.',
  AUDIT_LOG_MISMATCH: 'El hash guardado no coincide con el registrado en la auditoría.',
  AUDIT_LOG_MISSING: 'Falta el registro de auditoría del alta: no se guardó por el sistema.',
}

export const SIGNATURE_STATUS_LABELS: Record<SignatureStatus, string> = {
  MATCH: 'La firma electrónica corresponde al contenido actual.',
  MISMATCH: 'El contenido cambió después de la firma electrónica.',
  UNSIGNED: 'El acta no tiene firma electrónica.',
}

// "7e370adaa828c354…": los hashes tienen 64 caracteres; en pantalla alcanza con el principio
export function shortHash(hash: string, length = 16): string {
  return hash.length > length ? `${hash.slice(0, length)}…` : hash
}
