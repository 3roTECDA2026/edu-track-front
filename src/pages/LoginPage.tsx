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
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Assets institucionales
import logoEscuela from '@/assets/logo-normal.jpg';
import logoProvincia from '@/assets/bsas.png';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState('admin@notar.local');
  const [password, setPassword] = useState('Admin1234!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !password) {
      setError('Por favor, ingresa tu usuario y contraseña.');
      return;
    }

    setError(null);
    setLoading(true);

    try {

      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Credenciales inválidas o error en el servidor.');
      }

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', data.token);
      
      if (data.user) {
        storage.setItem('user', JSON.stringify(data.user));
      }

      navigate('/home');

    } catch (err: any) {
      setError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f9fafb',
      }}
    >
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

            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
              Gestión Escolar
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mb: 3, fontSize: '0.85rem' }}>
              Ingresá tu usuario y contraseña para acceder al sistema
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
              
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', display: 'block', mb: 0.5, letterSpacing: '0.05em' }}>
                USUARIO
              </Typography>
              <TextField
                margin="dense"
                required
                fullWidth
                id="user"
                name="user"
                autoComplete="user"
                size="small"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />

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

              {/* (Recordarme / Olvidé contraseña) */}
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

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar sesión'}
              </Button>
            </Box>
          </Paper>

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