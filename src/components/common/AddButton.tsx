import React from 'react';
import {
  Button,
  ButtonProps,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface AddButtonProps extends Omit<ButtonProps, 'variant' | 'startIcon'> {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  sx?: ButtonProps['sx'];
}

export const AddButton: React.FC<AddButtonProps> = ({
  label,
  onClick,
  icon = <AddIcon />,
  sx,
  ...props
}) => {
  // Estilos por defecto
  const defaultSx: ButtonProps['sx'] = {
    backgroundColor: '#111827',
    color: '#ffffff',
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 1.5,
    px: 2,
    '&:hover': { backgroundColor: '#1f2937' },
  };

  return (
    <Button
      variant="contained"
      startIcon={icon}
      onClick={onClick}
      sx={{ ...defaultSx, ...sx }}
      {...props}
    >
      {label}
    </Button>
  );
};

export default AddButton;
