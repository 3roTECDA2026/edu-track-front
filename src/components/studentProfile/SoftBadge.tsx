import { Box, Tooltip } from '@mui/material';

interface SoftBadgeProps {
  label: string;
  color: string;
  background: string;
  title?: string;
}

export const SoftBadge = ({ label, color, background, title }: SoftBadgeProps) => {
  const badge = (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 1,
        py: 0.25,
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color,
        backgroundColor: background,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Box>
  );

  return title ? <Tooltip title={title}>{badge}</Tooltip> : badge;
};

export default SoftBadge;
