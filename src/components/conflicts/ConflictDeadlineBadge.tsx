import { Chip } from '@mui/material'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import { ASSESSMENT_CONFIG } from '@/components/studentProfile/profileLabels'

// E4-RF-18: indica si el conflicto se registró dentro de las 24 hs desde el suceso.
interface ConflictDeadlineBadgeProps {
  withinDeadline: boolean | null
  elapsedHours: number | null
}

// Semáforo con la misma paleta de las valoraciones TEA / TED (ver docs/standard-mui.md).
// Cada estado lleva además texto e ícono, para que no dependa solo del color.
const ON_TIME = { ...ASSESSMENT_CONFIG.TEA, Icon: CheckCircleOutlinedIcon }
const LATE = { ...ASSESSMENT_CONFIG.TED, Icon: ErrorOutlinedIcon }
// Sin fecha del suceso no es un semáforo: se usan los grises del tema
const UNKNOWN = {
  color: 'text.secondary',
  background: 'action.hover',
  Icon: HelpOutlineOutlinedIcon,
}

function getBadge({ withinDeadline, elapsedHours }: ConflictDeadlineBadgeProps) {
  // Sin fecha del suceso (conflictos viejos) el plazo no se puede calcular
  if (withinDeadline === null) return { label: 'Sin fecha del suceso', ...UNKNOWN }

  if (withinDeadline) return { label: 'Registrado en plazo', ...ON_TIME }

  const hours = elapsedHours === null ? '' : ` (${elapsedHours} hs)`
  return { label: `Fuera de plazo${hours}`, ...LATE }
}

export const ConflictDeadlineBadge = (props: ConflictDeadlineBadgeProps) => {
  const { label, color, background, Icon } = getBadge(props)

  return (
    <Chip
      size="small"
      icon={<Icon sx={{ fontSize: 16 }} />}
      label={label}
      sx={{
        height: 24,
        borderRadius: '4px',
        fontWeight: 600,
        color,
        backgroundColor: background,
        '& .MuiChip-icon': { color },
      }}
    />
  )
}

export default ConflictDeadlineBadge
