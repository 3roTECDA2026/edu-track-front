// src/pages/HomePage.tsx
import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Stack } from '@mui/material';
import MainLayout from '../components/layout/MainLayout';

export const HomePage: React.FC = () => {
  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Encabezado Principal */}
        <Box sx={{ mb: 4, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0a2540', mb: 1 }}>
            Bienvenido a Edu-Track
          </Typography>
          <Typography variant="body1" sx={{ color: '#546e7a' }}>
            Gestión educativa simplificada para la Escuela Normal.
          </Typography>
        </Box>

        {/* Tarjetas del Dashboard */}
        <Grid container spacing={3}>
          {/* Tarjeta 1: Estudiantes */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 2, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#37474f', fontWeight: 'bold', mb: 1 }}>
                  Estudiantes
                </Typography>
                <Typography variant="h3" sx={{ color: '#1976d2', fontWeight: 900, my: 1 }}>
                  1,250
                </Typography>
                <Typography variant="caption" sx={{ color: '#78909c', fontWeight: 'medium' }}>
                  Total matriculados
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button fullWidth variant="contained" sx={{ backgroundColor: '#1976d2', textTransform: 'none', fontWeight: 'bold' }}>
                  Ver listado
                </Button>
              </Box>
            </Card>
          </Grid>

          {/* Tarjeta 2: Cursos Activos */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 2, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#37474f', fontWeight: 'bold', mb: 1 }}>
                  Cursos Activos
                </Typography>
                <Typography variant="h3" sx={{ color: '#2e7d32', fontWeight: 900, my: 1 }}>
                  45
                </Typography>
                <Typography variant="caption" sx={{ color: '#78909c', fontWeight: 'medium' }}>
                  Materias dictándose
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button fullWidth variant="contained" color="success" sx={{ textTransform: 'none', fontWeight: 'bold' }}>
                  Gestionar Cursos
                </Button>
              </Box>
            </Card>
          </Grid>

          {/* Tarjeta 3: Acciones Rápidas */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#37474f', fontWeight: 'bold', mb: 2 }}>
                  Acciones Rápidas
                </Typography>
                <Stack spacing={1.5}>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                      justifyContent: 'flex-start',
                      color: '#37474f',
                      borderColor: '#cfd8dc',
                      backgroundColor: '#f8fafc',
                      textTransform: 'none',
                      fontWeight: 'medium',
                      '&:hover': { backgroundColor: '#eceff1', borderColor: '#b0bec5' },
                    }}
                  >
                    ➕ Registrar nuevo estudiante
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                      justifyContent: 'flex-start',
                      color: '#37474f',
                      borderColor: '#cfd8dc',
                      backgroundColor: '#f8fafc',
                      textTransform: 'none',
                      fontWeight: 'medium',
                      '&:hover': { backgroundColor: '#eceff1', borderColor: '#b0bec5' },
                    }}
                  >
                    📋 Generar reporte de asistencias
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
};

export default HomePage;