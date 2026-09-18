// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Assets institucionales
import logoEscuela from '../assets/logo.png';
import logoProvincia from '../assets/bsas.png';

// Credenciales por defecto solicitadas
const DEFAULT_USER = 'normal';
const DEFAULT_PASS = '1234';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(DEFAULT_USER);
  const [password, setPassword] = useState(DEFAULT_PASS);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!usuario || !password) {
      setError('Por favor, ingresa tu usuario y contraseña.');
      return;
    }

    setError(null);
    navigate('/home');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f2f4f7' }}>
      {/* Header Superior Institucional */}
      <Box
        component="header"
        sx={{
          height: 60,
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          px: 3,
        }}
      >
        <Box
          component="img"
          src={logoProvincia}
          alt="Gobierno de la Provincia de Buenos Aires"
          sx={{ height: 36, objectFit: 'contain' }}
        />
      </Box>

      {/* Formulario de Login */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Container maxWidth="xs">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              borderRadius: 2,
              borderTop: '6px solid #003366',
            }}
          >
            {/* Escudo de la Escuela Normal */}
            <Box
              sx={{
                width: 80,
                height: 100,
                mb: 2,
                border: '2px solid #003366',
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

            <Typography variant="caption" sx={{ color: '#003366', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
              ESCUELA NORMAL S 10
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#111111', mt: 0.5, mb: 2 }}>
              Acceso al SGE
            </Typography>

            {/* Aviso de credenciales prestablecidas */}
            <Alert severity="info" sx={{ width: '100%', mb: 2, fontSize: '0.8rem' }}>
              <strong>Credenciales de prueba:</strong><br />
              Usuario: <code>normal</code><br />
              Contraseña: <code>1234</code>
            </Alert>

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="usuario"
                label="Usuario o correo institucional"
                name="usuario"
                autoComplete="username"
                size="small"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                size="small"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="mostrar u ocultar contraseña"
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 1,
                  py: 1.2,
                  backgroundColor: '#a70012',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  borderRadius: '20px',
                  '&:hover': { backgroundColor: '#88000e' },
                }}
              >
                Ingresar al Sistema
              </Button>
            </Box>
          </Paper>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                color: '#666666',
                fontSize: '0.65rem',
                lineHeight: 1.3,
                display: 'block',
                textTransform: 'uppercase',
              }}
            >
              CONSTITUYENTE Y EJECUTORA DEL SISTEMA EDUCATIVO
              <br />
              DIRECCIÓN GENERAL DE CULTURA Y EDUCACIÓN (DGOYE)
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LoginPage;