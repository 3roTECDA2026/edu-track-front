import type { ReactNode } from 'react';
import { Alert, Box, Button, Skeleton, Typography } from '@mui/material';
import { COLORS } from '@/components/studentProfile/profileStyles';

export const TabLoading = () => (
  <Box sx={{ display: 'grid', gap: 2 }}>
    <Skeleton variant="rounded" height={96} />
    <Skeleton variant="rounded" height={56} />
    <Skeleton variant="rounded" height={56} />
    <Skeleton variant="rounded" height={56} />
  </Box>
);

interface TabErrorProps {
  message: string;
  onRetry: () => void;
}

export const TabError = ({ message, onRetry }: TabErrorProps) => (
  <Alert
    severity="error"
    action={
      <Button color="inherit" size="small" onClick={onRetry}>
        Reintentar
      </Button>
    }
  >
    No se pudieron cargar los datos. {message}
  </Alert>
);

interface TabEmptyProps {
  icon: ReactNode;
  title: string;
  text: string;
}

export const TabEmpty = ({ icon, title, text }: TabEmptyProps) => (
  <Box sx={{ py: 7, px: 2, textAlign: 'center', border: `1px dashed ${COLORS.border}`, borderRadius: 2 }}>
    <Box
      sx={{
        width: 80,
        height: 80,
        mx: 'auto',
        mb: 2,
        borderRadius: '50%',
        backgroundColor: COLORS.surface,
        color: COLORS.muted,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& svg': { fontSize: 40 },
      }}
    >
      {icon}
    </Box>
    <Typography variant="h6" sx={{ mb: 0.5 }}>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      {text}
    </Typography>
  </Box>
);