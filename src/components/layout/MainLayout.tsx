// src/components/layout/MainLayout.tsx
import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Button,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';

// Importación de assets locales
import logoEscuela from '../../assets/logo.png';
import logoProvincia from '../../assets/bsas.png';

const drawerWidth = 240;

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
      {/* Sidebar Lateral */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#003366', // Azul marino institucional
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            px: 2,
            py: 3,
            borderRight: 'none',
          },
        }}
      >
        <Box>
          {/* Logo Rectangular de la Escuela */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 90,
                height: 110,
                mx: 'auto',
                mb: 1.5,
                border: '2px solid #ffffff',
                backgroundColor: '#002244',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 0.5,
              }}
            >
              <Box
                component="img"
                src={logoEscuela}
                alt="Escuela Normal Logo"
                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>

            {/* Subtítulo bajo el escudo */}
            <Typography
              variant="caption"
              sx={{
                color: '#ffffff',
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                display: 'block',
                mt: 0.5,
              }}
            >
              ESCUELA NORMAL S 10
            </Typography>
          </Box>

          {/* Botones de Navegación */}
          <List sx={{ mt: 3, px: 1 }}>
            <ListItem disablePadding sx={{ mb: 1.5 }}>
              <ListItemButton
                sx={{
                  backgroundColor: '#a70012', // Redondeado tipo píldora
                  color: '#ffffff',
                  borderRadius: '20px',
                  py: 0.8,
                  textAlign: 'center',
                  '&:hover': { backgroundColor: '#88000e' },
                }}
              >
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>
                      Panel
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                sx={{
                  borderRadius: '20px',
                  py: 0.8,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                }}
              >
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: '0.9rem', color: '#ffffff', textAlign: 'center' }}>
                      Estudiantes
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>

        {/* Legal / Pie de página del Sidebar */}
        <Box sx={{ px: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.55rem',
              lineHeight: 1.2,
              display: 'block',
              textAlign: 'left',
              textTransform: 'uppercase',
            }}
          >
            CONSTITUYENTE Y EJECUTORA DEL SISTEMA<br />
            EDUCATIVO EDUCATIVA<br />
            (LE PROV N° 18.808)<br />
            DIRECCIÓN GENERAL DE CULTURA Y<br />
            EDUCACIÓN (DGOYE)
          </Typography>
        </Box>
      </Drawer>

      {/* Contenido Principal */}
      <Box sx={{ flexGrow: 1, backgroundColor: '#f2f4f7', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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

        {/* Área de trabajo */}
        <Box component="main" sx={{ p: 4, flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;