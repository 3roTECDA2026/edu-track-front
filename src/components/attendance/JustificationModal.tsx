import React from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AddButton from '@/components/common/AddButton';
import type { AttendanceRecord, JustificationRecord } from '@/components/attendance/attendance.types';

type JustificationModalProps = {
  record: AttendanceRecord | null;
  reason: string;
  date: string;
  type: JustificationRecord['type'];
  onDateChange: (date: string) => void;
  onTypeChange: (type: JustificationRecord['type']) => void;
  onReasonChange: (reason: string) => void;
  onAdd: () => void;
  onClose: () => void;
};

const labelMap: Record<JustificationRecord['type'], string> = {
  ausente: 'Día completo (1.0)',
  media: 'Media falta (0.5)',
  cuarto: 'Cuarto de falta (0.25)',
};

export const JustificationModal: React.FC<JustificationModalProps> = ({
  record,
  reason,
  date,
  type,
  onDateChange,
  onTypeChange,
  onReasonChange,
  onAdd,
  onClose,
}) => {
  if (!record) return null;

  return (
    <Dialog open={Boolean(record)} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1.5, borderBottom: '1px solid #e5e7eb' }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 600, color: '#111827' }}>
          Justificaciones de inasistencia
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
          {record.student} — DNI: {record.dni} ({record.course})
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        {record.justifications.length > 0 && (
          <Box sx={{ mb: 3, mt: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', mb: 1.5 }}>
              Justificaciones registradas ({record.justifications.length})
            </Typography>
            <Stack spacing={1}>
              {record.justifications.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    backgroundColor: '#fafafa',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <Stack
  direction="row"
  sx={{
    mb: 0.5,
    justifyContent: 'space-between',
    alignItems: 'center',
  }}
>
  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
    Fecha: {item.date}
  </Typography>
  <Chip
    label={labelMap[item.type]}
    size="small"
    variant="outlined"
    sx={{ borderColor: '#d1d5db', color: '#111827' }}
  />
</Stack>
                  <Typography variant="body2" sx={{ color: '#111827' }}>
                    {item.reason}
                  </Typography>
                </Box>
              ))}
            </Stack>
            <Divider sx={{ my: 2.5, borderColor: '#e5e7eb' }} />
          </Box>
        )}

        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', mb: 1.5, mt: record.justifications.length === 0 ? 1 : 0 }}>
          Registrar nueva justificación
        </Typography>

       <Stack spacing={2}>
  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
    <TextField
      label="Fecha"
      type="date"
      value={date}
      onChange={(e) => onDateChange(e.target.value)}
      size="small"
      fullWidth
      slotProps={{
        inputLabel: {
          shrink: true, // ✅ Anidado correctamente en inputLabel
        },
      }}
    />

    <FormControl size="small" fullWidth>
      <InputLabel>Tipo de falta</InputLabel>
      <Select
        label="Tipo de falta"
        value={type}
        onChange={(e) => onTypeChange(e.target.value as JustificationRecord['type'])}
      >
        <MenuItem value="ausente">Día completo (1.0)</MenuItem>
        <MenuItem value="media">Media falta (0.5)</MenuItem>
        <MenuItem value="cuarto">Cuarto de falta (0.25)</MenuItem>
      </Select>
    </FormControl>
  </Stack>     
          <TextField
            label="Motivo / Observación"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            multiline
            rows={3}
            size="small"
            fullWidth
            placeholder="Ej: Certificado médico presentado..."
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e5e7eb' }}>
        <Button
          onClick={onClose}
          sx={{
            color: '#374151',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': { backgroundColor: '#f3f4f6' },
          }}
        >
          Cerrar
        </Button>
        <AddButton
          label="Guardar"
          icon={<SaveIcon />}
          onClick={onAdd}
          disabled={!reason.trim() || !date}
        />
      </DialogActions>
    </Dialog>
  );
};

export default JustificationModal;