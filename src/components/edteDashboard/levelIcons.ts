import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'

import type { RiskLevel } from '@/services/edteDashboard.service'

// Ícono de cada nivel del semáforo: la forma distingue el nivel aunque no se vea el color
// (círculo con "!" = alto, triángulo = medio, tilde = bajo)
export const LEVEL_ICONS: Record<RiskLevel, typeof ErrorOutlinedIcon> = {
  HIGH: ErrorOutlinedIcon,
  MEDIUM: WarningAmberOutlinedIcon,
  LOW: CheckCircleOutlinedIcon,
}
