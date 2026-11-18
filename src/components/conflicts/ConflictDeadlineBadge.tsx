import { Box } from '@mui/material'

// E4-RF-18: indica si el conflicto se registró dentro de las 24 hs desde el suceso.
interface ConflictDeadlineBadgeProps {
  withinDeadline: boolean | null
  elapsedHours: number | null
}

const COLORS = {
  onTime: { color: '#166534', background: '#dcfce7' },
  late: { color: '#991b1b', background: '#fee2e2' },
  unknown: { color: '#374151', background: '#f3f4f6' },
}

function getBadge({ withinDeadline, elapsedHours }: ConflictDeadlineBadgeProps) {
  // Sin fecha del suceso (conflictos viejos) el plazo no se puede calcular
  if (withinDeadline === null) return { label: 'Sin fecha del suceso', ...COLORS.unknown }

  if (withinDeadline) return { label: 'Registrado en plazo', ...COLORS.onTime }

  const hours = elapsedHours === null ? '' : ` (${elapsedHours} hs)`
  return { label: `Fuera de plazo${hours}`, ...COLORS.late }
}

export const ConflictDeadlineBadge = (props: ConflictDeadlineBadgeProps) => {
  const { label, color, background } = getBadge(props)

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 1,
        py: 0.25,
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 500,
        color,
        backgroundColor: background,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Box>
  )
}

export default ConflictDeadlineBadge
