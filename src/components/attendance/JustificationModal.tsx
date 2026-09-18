import React from 'react';
import { Box, Button, Divider, FormControl, InputLabel, MenuItem, Modal, Select, Stack, TextField, Typography } from '@mui/material';
import type { AttendanceRecord, JustificationRecord } from './attendance.types';

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

const typeLabel: Record<JustificationRecord['type'], string> = { ausente: 'Ausente', media: 'Media falta', cuarto: 'Cuarto' };

const JustificationModal: React.FC<JustificationModalProps> = ({ record, reason, date, type, onDateChange, onTypeChange, onReasonChange, onAdd, onClose }) => (
  <Modal open={Boolean(record)} onClose={onClose} aria-labelledby="justification-title">
    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { xs: 'calc(100% - 32px)', sm: 560 }, maxHeight: '90vh', overflowY: 'auto', bgcolor: 'background.paper', boxShadow: 24, p: 3, borderRadius: 1 }}>
      <Typography id="justification-title" variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Justificar inasistencia</Typography>
      <Typography variant="body2" sx={{ color: '#68737d', mb: 2 }}>{record?.student}</Typography>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Justificaciones registradas ({record?.justifications.length ?? 0})</Typography>
      <Stack spacing={1.25} sx={{ mb: 3 }}>
        {record?.justifications.map((justification) => <Box key={justification.id} sx={{ p: 1.5, border: '1px solid #e1e5e8', borderRadius: 1, backgroundColor: '#fafafa' }}><Stack direction="row" justifyContent="space-between" spacing={2}><Typography variant="body2" sx={{ fontWeight: 700 }}>{justification.date} · {typeLabel[justification.type]}</Typography><Typography variant="caption" color="success.main">Justificado</Typography></Stack><Typography variant="body2" sx={{ mt: 0.5, color: '#59636e' }}>{justification.reason}</Typography></Box>)}
        {!record?.justifications.length && <Typography variant="body2" color="text.secondary">Todavía no hay justificaciones registradas.</Typography>}
      </Stack>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Agregar justificación</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField label="Fecha" type="date" value={date} onChange={(event) => onDateChange(event.target.value)} size="small" fullWidth InputLabelProps={{ shrink: true }} />
        <FormControl size="small" fullWidth><InputLabel>Tipo</InputLabel><Select label="Tipo" value={type} onChange={(event) => onTypeChange(event.target.value as JustificationRecord['type'])}><MenuItem value="ausente">Ausente</MenuItem><MenuItem value="media">Media falta</MenuItem><MenuItem value="cuarto">Cuarto</MenuItem></Select></FormControl>
      </Stack>
      <TextField label="Motivo de la justificación" value={reason} onChange={(event) => onReasonChange(event.target.value)} multiline minRows={3} fullWidth autoFocus />
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 3 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancelar</Button>
        <Button variant="contained" onClick={onAdd} disabled={!date || !reason.trim()} sx={{ textTransform: 'none', backgroundColor: '#a70012' }}>Guardar justificación</Button>
      </Stack>
    </Box>
  </Modal>
);

export default JustificationModal;
