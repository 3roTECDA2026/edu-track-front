import React from 'react';
import { Box, Typography, IconButton, Chip, Tooltip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';

export interface HeaderBrandProps {
  brandName?: string;
  institutionName?: string;
  role?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

/**
 * Pure presentational component for Header brand identity, logo, and navigation.
 */
export const HeaderBrand: React.FC<HeaderBrandProps> = ({
  brandName = 'EduTrack',
  institutionName = 'Secundaria N° 10',
  role,
  showBackButton = false,
  onBack,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {showBackButton && (
        <Tooltip title="Volver">
          <IconButton
            size="small"
            onClick={onBack}
            aria-label="Volver atrás"
            sx={{
              color: '#000000',
              mr: 0.5,
              '&:hover': { backgroundColor: '#f3f4f6' },
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '4px',
          backgroundColor: '#ffffff',
          border: '1px solid #000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000000',
        }}
      >
        <SchoolIcon sx={{ fontSize: 18 }} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography
          variant="subtitle1"
          component="span"
          sx={{
            fontWeight: 800,
            letterSpacing: '0.02em',
            color: '#000000',
            lineHeight: 1,
          }}
        >
          {brandName}
        </Typography>

        {role && (
          <Chip
            label={role}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.72rem',
              fontWeight: 600,
              backgroundColor: '#ffffff',
              color: '#000000',
              borderRadius: '4px',
              border: '1px solid #000000',
            }}
          />
        )}

        {institutionName && (
          <Typography
            variant="caption"
            sx={{
              color: '#666666',
              display: { xs: 'none', md: 'inline' },
              ml: 0.5,
              fontWeight: 500,
            }}
          >
            · {institutionName}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default HeaderBrand;
