import { Chip, Tooltip } from '@mui/material';

interface SoftBadgeProps {
  label: string;
  color: string;
  background: string;
  title?: string;
}

// Chip de MUI con los colores suaves de la referencia de diseño.
export const SoftBadge = ({ label, color, background, title }: SoftBadgeProps) => {
  const badge = (
    <Chip
      label={label}
      size="small"
      sx={{
        height: 22,
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color,
        backgroundColor: background,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );

  return title ? <Tooltip title={title}>{badge}</Tooltip> : badge;
};

export default SoftBadge;