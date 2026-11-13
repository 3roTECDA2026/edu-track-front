import { Chip } from '@mui/material'

import { PATE_STATE_CONFIG, type PateState } from '@/components/edteReferrals/referralLabels'

interface PateStatusChipProps {
  state: PateState | null // null: no se pudo saber (falló el pedido de los PATE)
}

// Estado del PATE de un derivado, con texto e ícono para que no dependa del color (CRM-074)
export function PateStatusChip({ state }: PateStatusChipProps) {
  if (state === null) return <span aria-label="Estado del PATE desconocido">—</span>

  const { label, icon: Icon, emphasis } = PATE_STATE_CONFIG[state]
  const strong = emphasis !== 'none'
  return (
    <Chip
      size="small"
      variant="outlined"
      icon={<Icon fontSize="small" />}
      label={label}
      sx={{
        fontWeight: emphasis === 'alert' ? 700 : strong ? 600 : 500,
        color: strong ? 'text.primary' : 'text.secondary',
        borderColor: strong ? 'text.primary' : 'divider',
        // Borrador: borde punteado, para que se note sin confundirse con "Sin PATE"
        borderStyle: emphasis === 'inProgress' ? 'dashed' : 'solid',
        '& .MuiChip-icon': { color: 'inherit' },
      }}
    />
  )
}
