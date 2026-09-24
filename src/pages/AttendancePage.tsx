// src/pages/AttendancePage.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import MainLayout from '../components/layout/MainLayout';

export const AttendancePage: React.FC = () => {
  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0a2540', mb: 1 }}>
          Inasistencias
        </Typography>
        <Typography variant="body1" sx={{ color: '#546e7a' }}>
          Sección en construcción. Pronto podrás gestionar las inasistencias.
        </Typography>
      </Box>
    </MainLayout>
  );
};

export default AttendancePage;