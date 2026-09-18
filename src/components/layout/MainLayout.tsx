// src/components/layout/MainLayout.tsx
import React from 'react';
import { Box, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { Aside } from './Aside';

// Importación de asset local
import logoProvincia from '../../assets/bsas.png';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  // Función para cerrar sesión
  const handleLogout = () => {
    // Si utilizas localStorage/tokens, puedes limpiarlos aquí:
    // localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Lateral (Aside gris) */}
      <Aside />

      {/* Contenido Principal en Blanco y Negro */}
      <Box sx={{ flexGrow: 1, backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header Superior Negro con Botón Logout */}
        <Box
          component="header"
          sx={{
            height: 60,
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
          }}
        >
          <Box
            component="img"
            src={logoProvincia}
            alt="Gobierno de la Provincia de Buenos Aires"
            sx={{ height: 36, objectFit: 'contain' }}
          />

          {/* Botón de Salida / Logout */}
          <Button
            size="small"
            onClick={handleLogout}
            startIcon={<LogoutIcon sx={{ fontSize: '1.1rem !important' }} />}
            sx={{
              color: '#ffffff',
              textTransform: 'none',
              fontSize: '0.85rem',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
              },
            }}
          >
            Cerrar Sesión
          </Button>
        </Box>

        {/* Área de trabajo en blanco con texto negro */}
        <Box component="main" sx={{ p: 4, flexGrow: 1, color: '#000000' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;