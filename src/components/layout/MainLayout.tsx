// src/components/layout/MainLayout.tsx
import React from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Aside } from './Aside';
import { Header } from '../Header';


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
        <Header 
          onLogout={handleLogout} 
          user={{ name: 'Admin', role: 'Director', avatarUrl: '' }} 
        />

        {/* Área de trabajo en blanco con texto negro */}
        <Box component="main" sx={{ p: 4, flexGrow: 1, color: '#000000' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;