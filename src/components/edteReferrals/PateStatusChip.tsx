import { Chip } from '@mui/material'

import { PATE_STATE_CONFIG, type PateState } from '@/components/edteReferrals/referralLabels'

interface PateStatusChipProps {
  state: PateState | null // null: no se pudo saber (falló el pedido de los PATE)
}

// Estado del PATE de un derivado, con texto e ícono para que no dependa del color (CRM-074)
export function PateStatusChip({ state }: PateStatusChipProps) {
  if (state === null) return <span aria-label="Estado del PATE desconocido">—</span>

  const { label, icon: Icon, highlighted } = PATE_STATE_CONFIG[state]
  return (
    <Chip
      size="small"
      variant="outlined"
      icon={<Icon fontSize="small" />}
      label={label}
      sx={{
        fontWeight: highlighted ? 700 : 500,
        color: highlighted ? 'text.primary' : 'text.secondary',
        borderColor: highlighted ? 'text.primary' : 'divider',
        '& .MuiChip-icon': { color: 'inherit' },
      }}
    />
  )
}
