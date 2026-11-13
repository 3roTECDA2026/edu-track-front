import { Chip, Tooltip } from '@mui/material'
import type { SxProps, Theme } from '@mui/material'

interface RepeatMarkProps {
  sx?: SxProps<Theme>
}

// Marca "R" de materia recursada (CRM-082), igual que en el RITE. Va junto al nombre del alumno
// (grilla) o de la materia (ficha). Blanco y negro, como el resto de la app.
export const RepeatMark = ({ sx }: RepeatMarkProps) => (
  <Tooltip title="Recursa la materia">
    <Chip
      label="R"
      size="small"
      aria-label="Recursa la materia"
      variant="outlined"
      sx={{
        ml: 1,
        height: 20,
        borderRadius: '4px',
        fontWeight: 700,
        color: 'primary.main',
        borderColor: 'primary.main',
        '& .MuiChip-label': { px: 0.75 },
        ...sx,
      }}
    />
  </Tooltip>
)

export default RepeatMark
