import { Box, Paper, Skeleton, Typography } from '@mui/material'

interface IndicatorCardProps {
  label: string
  value: number | undefined
  hint?: string // Aclaración debajo del número (por ejemplo, "materias, no alumnos")
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
    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
      {label}
    </Typography>
    <Box sx={{ mt: 0.5 }}>
      {loading ? (
        <Skeleton width={48} height={44} />
      ) : (
        <Typography variant="h4" sx={{ color, fontWeight: 800 }}>
          {value ?? '—'}
        </Typography>
      )}
    </Box>
    {hint && (
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {hint}
      </Typography>
    )}
  </Paper>
)

export default IndicatorCard
