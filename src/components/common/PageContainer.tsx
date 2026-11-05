import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

interface PageContainerProps {
  children: ReactNode
  /** Ajustes puntuales, solo si una pantalla lo necesita de verdad */
  sx?: SxProps<Theme>
}

/**
 * Envoltorio estándar de toda pantalla (ver estandar-mui.html).
 * Mismo ancho máximo y mismos márgenes en todas, para que el breadcrumb,
 * el título y los cuadros queden siempre en el mismo lugar.
 */
export const PageContainer = ({ children, sx }: PageContainerProps) => (
  <Box sx={[{ maxWidth: 1280, mx: 'auto', p: 1 }, ...(Array.isArray(sx) ? sx : [sx])]}>
    {children}
  </Box>
)

export default PageContainer