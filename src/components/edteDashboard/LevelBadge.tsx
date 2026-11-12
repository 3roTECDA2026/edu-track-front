import { Chip, Tooltip } from '@mui/material'
import { LEVEL_CONFIG } from '@/components/edteDashboard/dashboardLabels'
import { LEVEL_ICONS } from '@/components/edteDashboard/levelIcons'
import type { RiskLevel } from '@/services/edteDashboard.service'

interface LevelBadgeProps {
  level: RiskLevel
  description?: string // Qué significa el nivel (con los umbrales del back), en el tooltip
}

// Etiqueta del semáforo de un alumno: ícono + texto + color. No depende solo del color.
export const LevelBadge = ({ level, description }: LevelBadgeProps) => {
  const config = LEVEL_CONFIG[level]
  const Icon = LEVEL_ICONS[level]
  const badge = (
    <Chip
      size="small"
      icon={<Icon sx={{ fontSize: 16 }} />}
      label={config.label}
      aria-label={config.text}
      sx={{
        height: 24,
        borderRadius: '4px',
        fontWeight: 600,
        color: config.color,
        backgroundColor: config.background,
        '& .MuiChip-icon': { color: config.color },
      }}
    />
  )
  return description ? <Tooltip title={description}>{badge}</Tooltip> : badge
}

export default LevelBadge
