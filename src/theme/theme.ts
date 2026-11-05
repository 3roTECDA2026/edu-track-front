// src/theme/theme.ts
import { createTheme } from '@mui/material/styles'

// Estándar visual del proyecto (ver estandar-mui.html).
// Lo que se define acá aplica a todas las pantallas: no repetirlo con sx en cada una.
export const theme = createTheme({
  palette: {
    primary: {
      main: '#111827',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626',
    },
    background: {
      default: '#f3f4f6',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 }, // título de página
    h6: { fontWeight: 700 }, // título dentro de pantalla
    body2: { fontSize: '0.875rem' }, // datos de tabla (14px)
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    // Botones: sin sombra y con las mismas esquinas en todo el sistema.
    // Los botones con borde de color "primary" (los secundarios) van en gris.
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 6 },
        outlined: ({ ownerState }) =>
          ownerState.color === 'primary' || ownerState.color === undefined
            ? {
                borderColor: '#d1d5db',
                color: '#374151',
                '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
              }
            : {},
      },
    },
    // Breadcrumbs: siempre con barra como separador
    MuiBreadcrumbs: {
      defaultProps: { separator: '/' },
    },
    // Cuadros con borde: mismo borde y esquinas que el ContentCard
    MuiPaper: {
      styleOverrides: {
        outlined: { borderColor: '#e5e7eb', borderRadius: 8 },
      },
    },
    // Tablas: encabezado gris, en mayúsculas y con letra chica
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#e5e7eb' },
        head: {
          backgroundColor: '#fafafa',
          fontWeight: 700,
          color: '#4b5563',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        },
      },
    },
  },
})
