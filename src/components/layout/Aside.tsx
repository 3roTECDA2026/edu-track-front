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
import logoEscuela from '../../assets/logo.png';
import { PlusIcon, UserIcon } from 'lucide-react';

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
  { label: 'Alta estudiantes', icon: <PlusIcon />, path: '/students/new' },  // Tal vez sea modal
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
          backgroundColor: '#ffffff',
          color: '#37474f',
          display: 'flex',
          flexDirection: 'column',
          px: 2,
          py: 3,
          borderRight: '1px solid #eceff1',
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
          '&:hover': { backgroundColor: '#f4f6f8' },
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            flexShrink: 0,
            borderRadius: '12px',
            backgroundColor: '#f1f4f8',
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
              color: '#102a43',
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
      <Box sx={{ borderBottom: '1px solid #eceff1', mb: 2 }} />

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
            '&:hover': { backgroundColor: '#f4f6f8' },
          }}
        >
          <Typography
            sx={{
              color: '#90a4ae',
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
              <ExpandLessIcon sx={{ fontSize: '1.1rem', color: '#90a4ae' }} />
            ) : (
              <ExpandMoreIcon sx={{ fontSize: '1.1rem', color: '#90a4ae' }} />
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
                      backgroundColor: isActive ? '#eaf1fa' : 'transparent',
                      '&:hover': {
                        backgroundColor: isActive ? '#eaf1fa' : '#f4f6f8',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isActive ? '#0a2540' : '#607d8b',
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
                            color: isActive ? '#0a2540' : '#37474f',
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
            color: '#b0bec5',
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