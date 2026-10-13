
import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('El enlace de recuperación no es válido.');
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError('La contraseña debe tener entre 8 y 72 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo cambiar la contraseña.');
      }

      setMessage('Contraseña actualizada correctamente. Ya podés iniciar sesión.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>

<Typography
  variant="h4"
  sx={{ fontWeight: 700, mb: 2 }}
>
  Nueva contraseña
</Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Establecé una nueva contraseña para tu cuenta NOTAR.
        </Typography>

        {!token && (
          <Alert severity="error" sx={{ mb: 2 }}>
            El enlace no contiene un token válido.
          </Alert>
        )}

        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!message && (
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Nueva contraseña"
              type="password"
              fullWidth
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              label="Confirmar contraseña"
              type="password"
              fullWidth
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !token}
            >
              {loading ? <CircularProgress size={24} /> : 'Guardar contraseña'}
            </Button>
          </Box>
        )}

        <Button component={Link} to="/login" sx={{ mt: 2 }}>
          Volver al inicio de sesión
        </Button>
      </Paper>
    </Container>
  );
}
