// src/components/layout/MainLayout.tsx
import React from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Aside } from '@/components/layout/Aside';
import { Header } from '@/components/Header';
import { clearSession, getSessionUser, getDisplayName, getRoleLabel } from '@/services/session';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();

  const handleLogout = () => {
  clearSession();
  navigate('/login', { replace: true });
};

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Lateral (Aside gris) */}
      <Aside />

      {/* Contenido Principal en Blanco y Negro */}
      <Box sx={{ flexGrow: 1, backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header
          onLogout={handleLogout}
          user={
            sessionUser
              ? { name: getDisplayName(sessionUser), role: getRoleLabel(sessionUser.role), avatarUrl: '' }
              : null
          }
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