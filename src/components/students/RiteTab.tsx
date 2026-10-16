import { useEffect, useState } from 'react'
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Stack,
  Alert,
} from '@mui/material'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import SaveIcon from '@mui/icons-material/Save'
import LockIcon from '@mui/icons-material/Lock'

import { ContentCard } from '@/components/common/ContentCard'
import { AddButton } from '@/components/common/AddButton'
import { getRiteData, updateRite, type RiteDataResponse } from '@/services/rite.service'

interface RiteTabProps {
  studentId: string
  academicYearId?: string // Opcional para evitar errores de tipado si la ficha no lo pasa directo
}

export const RiteTab = ({ studentId, academicYearId = 'current' }: RiteTabProps) => {
  const [term, setTerm] = useState<'FIRST' | 'SECOND'>('FIRST')
  const [data, setData] = useState<RiteDataResponse | null>(null)
  const [generalNotes, setGeneralNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRite = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getRiteData(studentId, academicYearId, term)
      setData(res)
      setGeneralNotes(res.rite.generalNotes || '')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar el RITE')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (studentId) {
      loadRite()
    }
  }, [studentId, academicYearId, term])

  const handleSaveNotes = async () => {
    if (!data?.rite.id) return
    try {
      await updateRite(data.rite.id, { generalNotes })
      await loadRite()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar las observaciones')
    }
  }

  const handleCloseRite = async () => {
    if (!data?.rite.id) return
    try {
      await updateRite(data.rite.id, { status: 'CLOSED' })
      await loadRite()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar el RITE')
    }
  }

  const isEditable = data?.rite.status === 'DRAFT'

  return (
    <Stack spacing={3}>
      <ContentCard sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Cabecera de controles y estado */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Cuatrimestre</InputLabel>
              <Select
                value={term}
                label="Cuatrimestre"
                onChange={(e) => setTerm(e.target.value as 'FIRST' | 'SECOND')}
              >
                <MenuItem value="FIRST">1° Cuatrimestre</MenuItem>
                <MenuItem value="SECOND">2° Cuatrimestre</MenuItem>
              </Select>
            </FormControl>

            {data?.rite.status && (
              <Chip
                label={`Estado: ${data.rite.status}`}
                sx={{
                  backgroundColor: data.rite.status === 'SIGNED' ? '#111827' : '#f3f4f6',
                  color: data.rite.status === 'SIGNED' ? '#ffffff' : '#111827',
                  fontWeight: 600,
                }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {isEditable && (
              <AddButton label="Cerrar RITE" icon={<LockIcon />} onClick={handleCloseRite} />
            )}
            <AddButton
              label="Descargar PDF"
              icon={<PictureAsPdfIcon />}
              onClick={() => alert('Generando PDF oficial DGCyE 2025...')}
            />
          </Box>
        </Box>

        {/* Tabla de Calificaciones y Trayectoria */}
        <TableContainer sx={{ overflowX: 'auto', mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#111827' }}>Materia</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#111827' }}>
                  Tipo (C/R)
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#111827' }}>
                  Valoración (1° C)
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#111827' }}>
                  Nota (1° C)
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#111827' }}>
                  Valoración (2° C)
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#111827' }}>
                  Nota (2° C)
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#111827' }}>
                  Estado
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    Cargando información del RITE...
                  </TableCell>
                </TableRow>
              ) : data?.subjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No hay materias registradas para este ciclo lectivo.
                  </TableCell>
                </TableRow>
              ) : (
                data?.subjects.map((sub) => (
                  <TableRow key={sub.enrollmentId} hover>
                    <TableCell sx={{ fontWeight: 600, color: '#111827' }}>
                      {sub.subjectName}
                    </TableCell>
                    <TableCell align="center">
                      {sub.courseType === 'FIRST_TIME' ? 'C' : 'R'}
                    </TableCell>
                    <TableCell align="center">
                      {sub.grade?.preliminaryAssessment1 || '—'}
                    </TableCell>
                    <TableCell align="center">{sub.grade?.term1Score ?? '—'}</TableCell>
                    <TableCell align="center">
                      {sub.grade?.preliminaryAssessment2 || '—'}
                    </TableCell>
                    <TableCell align="center">{sub.grade?.term2Score ?? '—'}</TableCell>
                    <TableCell align="center">
                      {sub.grade?.subjectStatus || 'En Cursada'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Resumen de inasistencias */}
        <Typography variant="body2" sx={{ mb: 3, color: '#374151' }}>
          <strong>Total de Inasistencias Computadas:</strong> {data?.attendance.totalAbsences ?? 0} faltas.
        </Typography>

        {/* Sección de Observaciones Generales */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#111827', fontWeight: 700 }}>
            Observaciones Generales del Equipo Docente
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            disabled={!isEditable}
            placeholder={
              isEditable
                ? 'Ingresá observaciones generales...'
                : 'El RITE se encuentra cerrado o firmado.'
            }
            sx={{ mb: 2 }}
          />
          {isEditable && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <AddButton
                label="Guardar Observaciones"
                icon={<SaveIcon />}
                onClick={handleSaveNotes}
              />
            </Box>
          )}
        </Box>
      </ContentCard>
    </Stack>
  )
}