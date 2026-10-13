
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        throw new Error('No se pudo procesar la solicitud.');
      }

      setMessage(
        'Si el correo está registrado, recibirás un enlace de recuperación.',
      );
    } catch {
      setError('No se pudo conectar con el servidor. Intentá nuevamente.');
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
  Recuperar contraseña
</Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Ingresá tu correo institucional para solicitar un enlace de
          recuperación de tu cuenta NOTAR.
        </Typography>

        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Correo electrónico"
            type="email"
            fullWidth
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Enviar enlace'}
          </Button>
        </Box>

        <Button component={Link} to="/login" sx={{ mt: 2 }}>
          Volver al inicio de sesión
        </Button>
      </Paper>
    </Container>
  );
}
