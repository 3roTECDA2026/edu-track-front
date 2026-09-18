import React, { useMemo, useState } from 'react';
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import MainLayout from '../components/layout/MainLayout';
import AttendanceFilters from '../components/attendance/AttendanceFilters';
import AttendanceTable from '../components/attendance/AttendanceTable';
import JustificationModal from '../components/attendance/JustificationModal';
import type { AttendanceFilters as AttendanceFilterValues, AttendanceRecord, JustificationRecord } from '../components/attendance/attendance.types';

const initialRecords: AttendanceRecord[] = [
  { id: 1, student: 'Pérez, Sofía Lucía', dni: '45.678.901', course: '3° Año Sección A', date: '2026-09-10', absences: 2, halfAbsences: 0, quarterAbsences: 0, justifications: [{ id: 101, date: '2026-09-10', type: 'ausente', reason: 'Certificado médico presentado.' }] },
  { id: 2, student: 'García, Mateo Nicolás', dni: '46.123.456', course: '3° Año Sección A', date: '2026-09-12', absences: 12, halfAbsences: 2, quarterAbsences: 1, justifications: [] },
  { id: 3, student: 'Luna, Camila', dni: '46.555.888', course: '3° Año Sección A', date: '2026-09-08', absences: 6, halfAbsences: 1, quarterAbsences: 3, justifications: [{ id: 103, date: '2026-09-08', type: 'ausente', reason: 'Turno médico.' }] },
  { id: 4, student: 'Romero, Agustina', dni: '48.999.000', course: '3° Año Sección A', date: '2026-09-14', absences: 18, halfAbsences: 4, quarterAbsences: 3, justifications: [] },
  { id: 5, student: 'Díaz, Tomás Agustín', dni: '45.333.777', course: '3° Año Sección A', date: '2026-09-11', absences: 0, halfAbsences: 0, quarterAbsences: 1, justifications: [{ id: 105, date: '2026-09-11', type: 'cuarto', reason: 'Actividad institucional.' }] },
  { id: 6, student: 'Benítez, Valentina', dni: '47.222.111', course: '2° Año Sección B', date: '2026-09-09', absences: 9, halfAbsences: 1, quarterAbsences: 0, justifications: [] },
];

const totalAbsence = (record: AttendanceRecord) => record.absences + record.halfAbsences * 0.5 + record.quarterAbsences * 0.25;
const justificationWeight: Record<JustificationRecord['type'], number> = { ausente: 1, media: 0.5, cuarto: 0.25 };
const justifiedTotal = (record: AttendanceRecord) => record.justifications.reduce((total, item) => total + justificationWeight[item.type], 0);
const formatTotal = (total: number) => total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const csvValue = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

const defaultFilters: AttendanceFilterValues = { course: 'Todos', from: '2026-01-01', to: '2026-12-31', search: '' };

export const AttendanceSummaryPage: React.FC = () => {
  const [records, setRecords] = useState(initialRecords);
  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [reason, setReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [justificationDate, setJustificationDate] = useState('2026-09-17');
  const [justificationType, setJustificationType] = useState<JustificationRecord['type']>('ausente');

  const courses = useMemo(() => [...new Set(records.map((record) => record.course))], [records]);
  const filteredRecords = useMemo(() => records
    .filter((record) => appliedFilters.course === 'Todos' || record.course === appliedFilters.course)
    .filter((record) => record.date >= appliedFilters.from && record.date <= appliedFilters.to)
    .filter((record) => record.student.toLowerCase().includes(appliedFilters.search.toLowerCase()) || record.dni.includes(appliedFilters.search))
    .sort((left, right) => (sortDirection === 'desc' ? 1 : -1) * (totalAbsence(right) - totalAbsence(left))), [records, appliedFilters, sortDirection]);

  const openJustification = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setReason('');
    setJustificationDate(record.date);
    setJustificationType('ausente');
  };

  const closeJustification = () => {
    setSelectedRecord(null);
    setReason('');
  };

  const addJustification = () => {
    if (!selectedRecord || !justificationDate || !reason.trim()) return;
    const newJustification: JustificationRecord = { id: Date.now(), date: justificationDate, type: justificationType, reason: reason.trim() };
    setRecords((current) => current.map((record) => record.id === selectedRecord.id ? { ...record, justifications: [...record.justifications, newJustification] } : record));
    closeJustification();
    setShowSuccess(true);
  };

  const exportCsv = () => {
    const headers = ['Alumno', 'DNI', 'Curso', 'Total inasistencias', 'Ausentes', 'Medias faltas', 'Cuartos', 'Justificadas', 'No justificadas'];
    const rows = filteredRecords.map((record) => [record.student, record.dni, record.course, formatTotal(totalAbsence(record)), record.absences, record.halfAbsences, record.quarterAbsences, formatTotal(justifiedTotal(record)), formatTotal(Math.max(0, totalAbsence(record) - justifiedTotal(record)))]);
    const csv = [headers, ...rows].map((row) => row.map(csvValue).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resumen-de-inasistencias.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <Box className="attendance-page" sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box className="print-hidden" sx={{ mb: 3 }}><Typography variant="caption" sx={{ color: '#7b8794' }}>Inicio &nbsp;›&nbsp; Asistencia &nbsp;›&nbsp; <strong>Resumen</strong></Typography></Box>
        <Stack sx={{ mb: 2 }}>
          <Box><Typography variant="h4" sx={{ color: '#202124', fontWeight: 800, fontSize: { xs: '1.65rem', md: '2rem' } }}>Resumen de inasistencias</Typography><Typography variant="body2" sx={{ color: '#7b8794' }}>Consultá el detalle de inasistencias por alumno o por curso.</Typography></Box>
        </Stack>
        <AttendanceFilters value={filters} courses={courses} onChange={setFilters} onApply={() => setAppliedFilters(filters)} />
        {showSuccess && <Alert className="print-hidden" onClose={() => setShowSuccess(false)} severity="success" sx={{ mb: 2 }}>La inasistencia fue justificada correctamente.</Alert>}
        <Stack className="print-hidden" direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 1.5, p: 1.5, backgroundColor: '#fafafa', border: '1px solid #e1e5e8', borderRadius: 1 }}>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select label="Ordenar por" value={sortDirection} onChange={(event) => setSortDirection(event.target.value as 'desc' | 'asc')}>
              <MenuItem value="desc">Más inasistencias primero</MenuItem>
              <MenuItem value="asc">Menos inasistencias primero</MenuItem>
            </Select>
          </FormControl>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button fullWidth variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv} sx={{ textTransform: 'none', borderColor: '#555', color: '#333' }}>Descargar CSV</Button>
            <Button fullWidth variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ textTransform: 'none', borderColor: '#555', color: '#333' }}>PDF / Imprimir</Button>
          </Stack>
        </Stack>
        <AttendanceTable records={filteredRecords} course={appliedFilters.course} totalAbsence={totalAbsence} justifiedTotal={justifiedTotal} formatTotal={formatTotal} onJustify={openJustification} />
      </Box>
      <JustificationModal record={selectedRecord} reason={reason} date={justificationDate} type={justificationType} onDateChange={setJustificationDate} onTypeChange={setJustificationType} onReasonChange={setReason} onAdd={addJustification} onClose={closeJustification} />
    </MainLayout>
  );
};

export default AttendanceSummaryPage;
