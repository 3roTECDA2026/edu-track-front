import React from 'react'
import { Paper, PaperProps } from '@mui/material'

interface ContentCardProps extends Omit<PaperProps, 'variant'> {
  children: React.ReactNode
  sx?: PaperProps['sx']
}

/**
 * Tarjeta contenedora estándar (ver estandar-mui).
 * Borde gris, esquinas redondeadas, igual en todas las pantallas.
 * Adentro va el contenido: pestañas (CustomTabs), tablas, lo que haga falta.
 */
export const ContentCard: React.FC<ContentCardProps> = ({ children, sx, ...props }) => {
  // Estilos por defecto del estándar
  const defaultSx: PaperProps['sx'] = {
    border: '1px solid #e5e7eb',
    borderRadius: 2, // 8px (MUI: 1 unidad = 4px)
    overflow: 'hidden',
  }

  return (
    <Paper variant="outlined" elevation={0} sx={{ ...defaultSx, ...sx }} {...props}>
      {children}
    </Paper>
  )
}

export default ContentCard
