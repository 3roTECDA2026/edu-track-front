import React from 'react';
import { Box, Typography, Button, Avatar } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';

export interface UserProfile {
  name: string;
  role?: string;
  shift?: string;
  avatarUrl?: string;
}

export interface HeaderUserProps {
  user?: UserProfile | null;
  onLogin?: () => void;
  onLogout?: () => void;
  rightAction?: React.ReactNode;
}

/**
 * Pure presentational component for user identity and authentication actions in the Header.
 */
export const HeaderUser: React.FC<HeaderUserProps> = ({
  user,
  onLogin,
  onLogout,
  rightAction,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {rightAction}

      {user ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Avatar
              src={user.avatarUrl}
              sx={{
                width: 30,
                height: 30,
                bgcolor: '#ffffff',
                color: '#000000',
                border: '1px solid #000000',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: '#000000',
                  lineHeight: 1.2,
                  fontSize: '0.82rem',
                }}
              >
                {user.name}
              </Typography>
              {(user.role || user.shift) && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#666666',
                    lineHeight: 1,
                    fontSize: '0.7rem',
                    display: 'block',
                  }}
                >
                  {[user.role, user.shift].filter(Boolean).join(' · ')}
                </Typography>
              )}
            </Box>
          </Box>

          {onLogout && (
            <Button
              size="small"
              onClick={onLogout}
              aria-label="Cerrar sesión"
              startIcon={<LogoutIcon sx={{ fontSize: '0.95rem !important' }} />}
              sx={{
                color: '#000000',
                textTransform: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: '4px',
                py: 0.4,
                px: 1.4,
                border: '1px solid #000000',
                backgroundColor: '#ffffff',
                '&:hover': {
                  backgroundColor: '#000000',
                  color: '#ffffff',
                },
              }}
            >
              Salir
            </Button>
          )}
        </Box>
      ) : (
        onLogin && (
          <Button
            size="small"
            onClick={onLogin}
            startIcon={<LoginIcon sx={{ fontSize: '0.95rem !important' }} />}
            sx={{
              backgroundColor: '#000000',
              color: '#ffffff',
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.8rem',
              borderRadius: '4px',
              px: 2,
              border: '1px solid #000000',
              '&:hover': {
                backgroundColor: '#ffffff',
                color: '#000000',
              },
            }}
          >
            Iniciar Sesión
          </Button>
        )
      )}
    </Box>
  );
};

export default HeaderUser;
