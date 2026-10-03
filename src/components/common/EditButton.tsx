import React from 'react';
import { IconButton, IconButtonProps, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

interface EditButtonProps extends Omit<IconButtonProps, 'onClick'> {
  onClick: () => void;
  label?: string;
  sx?: IconButtonProps['sx'];
}

/**
 * Botón de editar estándar (ver estandar-mui): lapicito negro.
 * Mismo modelo de "editar" para todas las pantallas.
 */
export const EditButton: React.FC<EditButtonProps> = ({
  onClick,
  label = 'Editar',
  sx,
  ...props
}) => {
  
  const defaultSx: IconButtonProps['sx'] = {
    color: '#374151', 
  };

  return (
    <Tooltip title={label}>
      <IconButton
        size="small"
        onClick={onClick}
        aria-label={label}
        sx={{ ...defaultSx, ...sx }}
        {...props}
      >
        <EditIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default EditButton;
