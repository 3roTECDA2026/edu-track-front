// src/components/layout/Aside.tsx
import React, { useState } from 'react';
import {
  Box,
  Collapse,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useLocation, useNavigate } from 'react-router-dom';

// Importación de asset local
import logoEscuela from '../../assets/logo.png';

const drawerWidth = 240;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Panel', icon: <DashboardIcon />, path: '/home' },
  { label: 'Estudiantes', icon: <PeopleIcon /> },
  { label: 'Cursos', icon: <SchoolIcon /> },
  { label: 'Inasistencias', icon: <EventNoteIcon />, path: '/attendance' },
];

export const Aside: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);

  const handleNavigation = (item: NavItem) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#e0e0e0', // Fondo gris del aside
          color: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 2,
          py: 3,
          borderRight: '1px solid #bdbdbd',
        },
      }}
    >
      {/* Logo de la Escuela */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Box
          sx={{
            width: 90,
            height: 110,
            mx: 'auto',
            mb: 1.5,
            border: '2px solid #000000',
            backgroundColor: '#ffffff',
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

        <Typography
          variant="caption"
          sx={{
            color: '#424242',
            textTransform: 'uppercase',
            fontSize: '0.65rem',
            display: 'block',
            mt: 0.5,
          }}
        >
          ESCUELA NORMAL S 10
        </Typography>
      </Box>

      {/* Título de la navegación (desplegable) */}
      <List sx={{ mt: 3, px: 1, width: '100%' }}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            onClick={() => setOpen((prev) => !prev)}
            sx={{
              borderRadius: '12px',
              py: 1,
              px: 1.5,
              backgroundColor: '#9e9e9e',
              color: '#ffffff',
              '&:hover': { backgroundColor: '#757575' },
            }}
          >
            <ListItemText
              primary={
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Navegación
                </Typography>
              }
            />
            <ListItemIcon sx={{ minWidth: 24, color: '#ffffff' }}>
              {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemIcon>
          </ListItemButton>
        </ListItem>

        {/* Botones de navegación desplegables */}
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {NAV_ITEMS.map((item) => {
              const isActive = item.path === location.pathname;
              return (
                <ListItem key={item.label} disablePadding sx={{ mb: 1.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item)}
                    sx={{
                      backgroundColor: isActive ? '#000000' : '#f5f5f5',
                      color: isActive ? '#ffffff' : '#000000',
                      borderRadius: '12px',
                      py: 1,
                      px: 1.5,
                      '&:hover': {
                        backgroundColor: isActive ? '#000000' : '#cfcfcf',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isActive ? '#ffffff' : '#000000',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            fontSize: '0.9rem',
                            fontWeight: isActive ? 'bold' : 'normal',
                          }}
                        >
                          {item.label}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>
      </List>
    </Drawer>
  );
};

export default Aside;