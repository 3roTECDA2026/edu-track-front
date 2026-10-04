import { useState } from 'react';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { cardSx } from '@/components/studentProfile/profileStyles';

const MAX_LENGTH = 2000;

interface ObservationsTabProps {
  studentId: string;
  onSaved: (message: string, severity: 'success' | 'error') => void;
}

function readSaved(storageKey: string): string {
  try {
    return localStorage.getItem(storageKey) ?? '';
  } catch {
    return '';
  }
}

// Todavía no hay un campo en el back para las observaciones, así que se guardan en este navegador.
// Cuando exista el endpoint, solo hay que cambiar handleSave y readSaved.
export const ObservationsTab = ({ studentId, onSaved }: ObservationsTabProps) => {
  const storageKey = `edutrack:student-observations:${studentId}`;
  const [savedText, setSavedText] = useState(() => readSaved(storageKey));
  const [text, setText] = useState(savedText);
  const hasChanges = text !== savedText;

  const handleSave = () => {
    try {
      localStorage.setItem(storageKey, text);
      setSavedText(text);
      onSaved('Observaciones guardadas.', 'success');
    } catch {
      onSaved('No se pudieron guardar las observaciones.', 'error');
    }
  };

  return (
    <Paper variant="outlined" sx={{ ...cardSx, p: 2.5 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Observaciones
      </Typography>

      <TextField
        multiline
        minRows={6}
        fullWidth
        placeholder="Escribí observaciones sobre la trayectoria del estudiante..."
        value={text}
        onChange={(event) => setText(event.target.value.slice(0, MAX_LENGTH))}
      />

      <Box
        sx={{
          mt: 1.5,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {text.length}/{MAX_LENGTH} caracteres
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button color="inherit" disabled={!hasChanges} onClick={() => setText(savedText)}>
            Descartar
          </Button>
          <Button
            variant="contained"
            disableElevation
            startIcon={<SaveIcon />}
            disabled={!hasChanges}
            onClick={handleSave}
          >
            Guardar
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ObservationsTab;