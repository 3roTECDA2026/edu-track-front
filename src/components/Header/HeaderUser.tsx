import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

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
 * The user avatar/name acts as a trigger for a dropdown menu with auth actions.
 */
export const HeaderUser: React.FC<HeaderUserProps> = ({
  user,
  onLogin,
  onLogout,
  rightAction,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout?.();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {user ? (
        <>
          <IconButton
            onClick={handleOpen}
            aria-controls={open ? 'user-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            disableRipple
            sx={{
              borderRadius: '6px',
              px: 1,
              py: 0.5,
              gap: 1.2,
              '&:hover': { backgroundColor: '#f0f0f0' },
            }}
          >
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

            <KeyboardArrowDownIcon
              sx={{
                fontSize: '1rem',
                color: '#666666',
                transition: 'transform 0.2s',
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </IconButton>

          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                elevation: 2,
                sx: {
                  mt: 0.5,
                  minWidth: 180,
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                },
              },
            }}
          >
            {/* User info summary at top of menu */}
            <Box sx={{ px: 2, py: 1.2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                {user.name}
              </Typography>
              {(user.role || user.shift) && (
                <Typography variant="caption" sx={{ color: '#666666', fontSize: '0.7rem' }}>
                  {[user.role, user.shift].filter(Boolean).join(' · ')}
                </Typography>
              )}
            </Box>

            {rightAction && (
              <>
                <Divider />
                <Box sx={{ px: 1, py: 0.5 }}>{rightAction}</Box>
              </>
            )}

            {onLogout && (
              <>
                <Divider />
                <MenuItem
                  onClick={handleLogout}
                  sx={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#f5f5f5' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <LogoutIcon sx={{ fontSize: '1rem' }} />
                  </ListItemIcon>
                  <ListItemText primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    Sign out
                  </ListItemText>
                </MenuItem>
              </>
            )}
          </Menu>
        </>
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
            Sign in
          </Button>
        )
      )}
    </Box>
  );
};

export default HeaderUser;
