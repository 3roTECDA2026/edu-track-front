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
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GradingIcon from '@mui/icons-material/Grading';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useLocation, useNavigate } from 'react-router-dom';

// Importación de asset local
import logoEscuela from '@/assets/logo.png';
import { UserIcon } from 'lucide-react';


const drawerWidth = 250;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Panel', icon: <DashboardIcon />, path: '/home' },
  { label: 'Usuarios', icon: <UserIcon />, path: '/users' },
  { label: 'Estudiantes', icon: <PeopleIcon />, path: '/students' },
  { label: 'Cursos', icon: <SchoolIcon />, path: '/courses' },
  { label: 'Inasistencias', icon: <EventNoteIcon />, path: '/attendance' },
  { label: 'Calificaciones', icon: <GradingIcon />, path: '/calification-grid' },
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
          backgroundColor: '#d1d5db',
          color: '#111827',
          display: 'flex',
          flexDirection: 'column',
          px: 2,
          py: 3,
          borderRight: '1px solid #9ca3af',
        },
      }}
    >
      {/* Logo de la Escuela (clicable → Panel) */}
      <Box
        onClick={() => navigate('/home')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 3,
          px: 1,
          cursor: 'pointer',
          borderRadius: '10px',
          py: 0.75,
          '&:hover': { backgroundColor: '#e5e7eb' },
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            flexShrink: 0,
            borderRadius: '12px',
            backgroundColor: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0.75,
          }}
        >
          <Box
            component="img"
            src={logoEscuela}
            alt="Escuela Normal Logo"
            sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: '#111827',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              lineHeight: 1.2,
            }}
          >
            Escuela Normal
          </Typography>
        </Box>
      </Box>

      {/* Separador sutil */}
      <Box sx={{ borderBottom: '1px solid #9ca3af', mb: 2 }} />

      <List sx={{ px: 0, width: '100%' }} disablePadding>
        <ListItem
          disablePadding
          onClick={() => setOpen((prev) => !prev)}
          sx={{
            mb: 1,
            px: 1,
            py: 0.5,
            display: 'flex',
            justifyContent: 'space-between',
            cursor: 'pointer',
            borderRadius: '8px',
            '&:hover': { backgroundColor: '#e5e7eb' },
          }}
        >
          <Typography
            sx={{
              color: '#374151',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Navegación
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {open ? (
              <ExpandLessIcon sx={{ fontSize: '1.1rem', color: '#374151' }} />
            ) : (
              <ExpandMoreIcon sx={{ fontSize: '1.1rem', color: '#374151' }} />
            )}
          </Box>
        </ListItem>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {NAV_ITEMS.map((item) => {
              const isActive = item.path === location.pathname;
              return (
                <ListItem key={item.label} disablePadding sx={{ mb: 0.5, px: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item)}
                    sx={{
                      borderRadius: '10px',
                      px: 1.5,
                      py: 0.9,
                      backgroundColor: isActive ? '#e5e7eb' : 'transparent',
                      '&:hover': {
                        backgroundColor: isActive ? '#e5e7eb' : '#e5e7eb',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isActive ? '#111827' : '#4b5563',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            fontSize: '0.9rem',
                            fontWeight: isActive ? 'bold' : 500,
                            color: isActive ? '#111827' : '#374151',
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

      {/* Pie del aside */}
      <Box sx={{ mt: 'auto', px: 1, pt: 2 }}>
        <Typography
          sx={{
            color: '#4b5563',
            fontSize: '0.65rem',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          ISFDyT Nº 166 · Tandil
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Aside;
