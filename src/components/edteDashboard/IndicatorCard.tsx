import type { ReactNode } from 'react'
import { Box, Paper, Skeleton, Typography } from '@mui/material'

interface IndicatorCardProps {
  label: string
  value: number | undefined
  hint?: string // Aclaración debajo del número (por ejemplo, "materias, no alumnos")
  icon?: ReactNode // Ícono del nivel del semáforo, para que no dependa solo del color
  levelText?: string // Texto del nivel ("Riesgo alto"), por la misma razón
  color: string // Color del número y de la barra lateral (semáforo)
  background: string
  loading?: boolean
}

// Tarjeta de un indicador del dashboard del EDTE (CRM-077): número grande con el color del
// semáforo. Mientras carga, muestra un esqueleto para que el diseño no salte.
export const IndicatorCard = ({
  label,
  value,
  hint,
  icon,
  levelText,
  color,
  background,
  loading = false,
}: IndicatorCardProps) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      borderRadius: 2,
      borderLeft: `4px solid ${color}`,
      backgroundColor: background,
    }}
  >
    <Box
      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}
    >
      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        {label}
      </Typography>
      {icon && (
        <Box aria-hidden sx={{ color, display: 'flex' }}>
          {icon}
        </Box>
      )}
    </Box>
    <Box sx={{ mt: 0.5 }}>
      {loading ? (
        <Skeleton width={48} height={44} />
      ) : (
        <Typography variant="h4" sx={{ color, fontWeight: 800 }}>
          {value ?? '—'}
        </Typography>
      )}
    </Box>
    {levelText && (
      <Typography variant="caption" sx={{ color, fontWeight: 700, display: 'block' }}>
        {levelText}
      </Typography>
    )}
    {hint && (
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {hint}
      </Typography>
    )}
  </Paper>
)

export default IndicatorCard
