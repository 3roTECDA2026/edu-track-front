import React from 'react'
import { Box, Typography } from '@mui/material'
import { Breadcrumbs } from '@/components/Header/Breadcrumbs'
import type { BreadcrumbItem } from '@/components/Header/Breadcrumbs'

interface PageHeaderProps {
  /** Título principal de la pantalla (variant h4 del estándar) */
  title: string
  /** Texto gris debajo del título (opcional) */
  subtitle?: string
  /** Items del breadcrumb. Obligatorio: toda pantalla muestra su ubicación. */
  breadcrumbs: BreadcrumbItem[]
  /** Acción opcional a la derecha del título (ej: un AddButton) */
  action?: React.ReactNode
}

/**
 * Encabezado estándar de pantalla (ver docs/estandar-mui.md).
 * Arma breadcrumb + título + subtítulo igual en todas las pantallas.
 * Cada pantalla solo pasa su texto; los tamaños y colores salen del estándar.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  action,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      {/* Breadcrumb: componente reutilizable del proyecto */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs items={breadcrumbs} />
      </Box>

      {/* Fila de título + acción opcional a la derecha */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#111827', mb: 0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" sx={{ color: '#6b7280' }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      </Box>
    </Box>
  )
}

export default PageHeader