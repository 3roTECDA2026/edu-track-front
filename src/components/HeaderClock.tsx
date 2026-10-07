import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export const HeaderClock: React.FC = () => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 0.75,
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 2,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      <AccessTimeIcon sx={{ fontSize: 18, color: '#6b7280' }} />
      <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#111827' }}>
        {time || '00:00:00'}
      </Typography>
    </Box>
  );
};

export default HeaderClock;