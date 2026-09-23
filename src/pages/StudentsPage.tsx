// src/pages/StudentsPage.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import MainLayout from '../components/layout/MainLayout';

export const StudentsPage: React.FC = () => {
  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0a2540', mb: 1 }}>
          Estudiantes
        </Typography>
        <Typography variant="body1" sx={{ color: '#546e7a' }}>
          Sección en construcción. Pronto podrás gestionar el listado de estudiantes.
        </Typography>
      </Box>
    </MainLayout>
  );
};

export default StudentsPage;