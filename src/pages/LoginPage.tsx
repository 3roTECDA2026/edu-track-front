// ==========================================
// 1. IMPORTACIONES
// ==========================================
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
  FormControlLabel,
  Checkbox,
  Link,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Assets institucionales
import logoEscuela from '../assets/logo-normal.jpg';
import logoProvincia from '../assets/bsas.png';

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  // ----------------------------------------
  // Estados del formulario
  // ----------------------------------------
  const [usuario, setUsuario] = useState('admin.escola');
  const [password, setPassword] = useState('********');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------
  // Manejadores de eventos (Handlers)
  // ----------------------------------------
  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!usuario || !password) {
      setError('Por favor, ingresa tus credenciales.');
      return;
    }

    setError(null);
    // Aquí puedes realizar tu fetch si lo necesitas más adelante
    navigate('/home');
  };

  // ----------------------------------------
  // Renderizado (JSX)
  // ----------------------------------------
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f9fafb',
      }}
    >
      {/* 1. Header Superior Institucional (Provincia de Buenos Aires) */}
      <Box
        component="header"
        sx={{
          height: 65,
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
          sx={{ height: 65, objectFit: 'contain' }}
        />
      </Box>

      {/* 2. Contenedor Central del Formulario */}
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
          
          {/* TARJETA PRINCIPAL (PAPER) */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              borderRadius: 3,
              border: '1px solid #e5e7eb',
            }}
          >
            {/* Logo / Icono Superior */}
            <Box
              sx={{
                width: 43,
                height: 64,
                mb: 2.5,
                borderRadius: 0,
                border: '1px solid #d1d5db',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
              }}
            >
              <Box
                component="img"
                src={logoEscuela}
                alt="Ícono Escuela"
                sx={{ width: 64, height: 64, objectFit: 'contain' }}
              />
            </Box>

            {/* Encabezado de Títulos */}
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
              Gestión Escolar
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mb: 3, fontSize: '0.85rem' }}>
              Ingresá tu usuario y contraseña para acceder al sistema
            </Typography>

            {/* Alerta de Error (si existe) */}
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* FORMULARIO */}
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
              
              {/* Input: Usuario */}
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', display: 'block', mb: 0.5, letterSpacing: '0.05em' }}>
                USUARIO
              </Typography>
              <TextField
                margin="dense"
                required
                fullWidth
                id="usuario"
                name="usuario"
                autoComplete="username"
                size="small"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />

              {/* Input: Contraseña */}
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', display: 'block', mb: 0.5, letterSpacing: '0.05em' }}>
                CONTRASEÑA
              </Typography>
              <TextField
                margin="dense"
                required
                fullWidth
                name="password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                size="small"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="mostrar u ocultar contraseña"
                          onClick={handleClickShowPassword}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Opciones adicionales (Recordarme / Olvidé contraseña) */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, mt: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      size="small"
                      sx={{ color: '#4b5563', '&.Mui-checked': { color: '#111827' } }}
                    />
                  }
                  label={<Typography sx={{ fontSize: '0.85rem', color: '#4b5563' }}>Recordarme</Typography>}
                />
                <Link href="#" variant="body2" sx={{ fontSize: '0.85rem', color: '#4b5563', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Olvidé mi contraseña
                </Link>
              </Box>

              {/* Botón de Envío */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  py: 1.2,
                  backgroundColor: '#1f2937',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  borderRadius: '8px',
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#111827', boxShadow: 'none' },
                }}
              >
                Iniciar sesión →
              </Button>
            </Box>
          </Paper>

          {/* PIE DE PÁGINA / FOOTER */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.75rem', display: 'block', mb: 0.5 }}>
              Sistema de Gestión Escolar v1.0
            </Typography>
            <Link href="#" variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem', textDecoration: 'underline' }}>
              Soporte técnico
            </Link>
          </Box>

        </Container>
      </Box>
    </Box>
  );
};

export default LoginPage;