import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';

type Severity = 'success' | 'error';

interface Notifier {
  success: (message: string) => void;
  error: (message: string) => void;
}

const NotificationContext = createContext<Notifier | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<{ message: string; severity: Severity } | null>(null);

  const success = useCallback((message: string) => setToast({ message, severity: 'success' }), []);
  const error = useCallback((message: string) => setToast({ message, severity: 'error' }), []);
  const value = useMemo(() => ({ success, error }), [success, error]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={(_, reason) => reason !== 'clickaway' && setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotify = (): Notifier => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotify debe usarse dentro de <NotificationProvider>');
  return ctx;
};