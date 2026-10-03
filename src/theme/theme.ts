// src/theme/theme.ts
import { createTheme } from "@mui/material/styles";


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
});

