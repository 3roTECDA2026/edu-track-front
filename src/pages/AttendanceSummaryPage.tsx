import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import DownloadIcon from '@mui/icons-material/Download'
import VisibilityIcon from '@mui/icons-material/Visibility'

import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { StandardTablePagination } from '@/components/common/StandardTablePagination'
import JustificationModal from '@/components/attendance/JustificationModal'
import type {
  AttendanceRecord,
  JustificationRecord,
} from '@/components/attendance/attendance.types'
import {
  attendanceService,
  type AttendanceSection,
  type AttendanceSummaryItem,
} from '@/services/attendance.service'

type Period = 'FULL' | 'FIRST' | 'SECOND'

const PERIOD_LABELS: Record<Period, string> = {
  FULL: 'Ciclo completo',
  FIRST: '1° cuatrimestre',
  SECOND: '2° cuatrimestre',
}

// Umbrales para resaltar: ausentes en rojo y la barra de % en naranja o rojo
const HIGH_ABSENCES = 10
const WARNING_PERCENTAGE = 93
const DANGER_PERCENTAGE = 90

// Tipo de falta del modal → valor que guarda el back
const TYPE_TO_VALUE: Record<JustificationRecord['type'], 'ABSENT' | 'HALF' | 'QUARTER'> = {
  ausente: 'ABSENT',
  media: 'HALF',
  cuarto: 'QUARTER',
}

const percentageColor = (value: number) =>
  value < DANGER_PERCENTAGE ? '#dc2626' : value < WARNING_PERCENTAGE ? '#b45309' : '#111827'

const sectionLabel = (section: AttendanceSection) =>
  `${section.grade}° Año Sección ${section.division}`

type AppliedFilters = { search: string; sectionId: string; period: Period }

const buildQuery = (filters: AppliedFilters, page: number, pageSize: number) => {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    period: filters.period,
  })
  if (filters.search.trim()) query.set('search', filters.search.trim())
  if (filters.sectionId) query.set('sectionId', filters.sectionId)
  return query
}

const columns = [
  'Alumno',
  'DNI',
  'Total clases',
  'Presentes',
  'Ausentes',
  'Justif.',
  'Retardos',
  '% Asistencia',
  'Detalle',
]

export const AttendanceSummaryPage = () => {
  const [sections, setSections] = useState<AttendanceSection[]>([])

  // Filtros que se están editando y filtros aplicados con "Filtrar"
  const [search, setSearch] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [period, setPeriod] = useState<Period>('FULL')
  const [applied, setApplied] = useState<AppliedFilters>({
    search: '',
    sectionId: '',
    period: 'FULL',
  })

  const [items, setItems] = useState<AttendanceSummaryItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState<{ severity: 'success' | 'error'; text: string } | null>(null)

  // Modal de justificación (el del proyecto)
  const [selected, setSelected] = useState<AttendanceSummaryItem | null>(null)
  const [justDate, setJustDate] = useState('')
  const [justType, setJustType] = useState<JustificationRecord['type']>('ausente')
  const [justReason, setJustReason] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    attendanceService
      .getSummarySections(controller.signal)
      .then(setSections)
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await attendanceService.getSummary(buildQuery(applied, page + 1, rowsPerPage))
      setItems(data.items)
      setTotal(data.pagination.total)
      return data.items
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el resumen de asistencia')
      return []
    } finally {
      setLoading(false)
    }
  }, [applied, page, rowsPerPage])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  const appliedSection = sections.find((section) => section.id === applied.sectionId)
  const resultsTitle = appliedSection ? sectionLabel(appliedSection) : 'Todos los cursos'

  function handleFilter() {
    setApplied({ search, sectionId, period })
    setPage(0)
  }

  // Exporta todo lo filtrado (no solo la página visible) a un CSV que abre Excel
  async function handleExport() {
    setExporting(true)
    try {
      const rows: AttendanceSummaryItem[] = []
      let currentPage = 1
      let totalPages = 1
      do {
        const data = await attendanceService.getSummary(buildQuery(applied, currentPage, 100))
        rows.push(...data.items)
        totalPages = data.pagination.totalPages
        currentPage += 1
      } while (currentPage <= totalPages)

      const header = [
        'Alumno',
        'DNI',
        'Curso',
        'Total clases',
        'Presentes',
        'Ausentes',
        'Justificadas',
        'Retardos',
        '% Asistencia',
      ]
      const lines = rows.map((row) =>
        [
          row.student,
          row.dni,
          row.course,
          row.totalClasses,
          row.presents,
          row.absences,
          row.justified,
          row.lateArrivals,
          row.attendancePercentage.toString().replace('.', ','),
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(';')
      )
      // El BOM al principio hace que Excel respete los acentos
      const csv = '\uFEFF' + [header.join(';'), ...lines].join('\r\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `resumen-asistencia-${resultsTitle.replace(/\s+/g, '-')}-${PERIOD_LABELS[applied.period].replace(/\s+/g, '-')}.csv`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err: unknown) {
      setToast({
        severity: 'error',
        text: err instanceof Error ? err.message : 'No se pudo exportar',
      })
    } finally {
      setExporting(false)
    }
  }

  // Abre el modal con la falta sin justificar más reciente ya elegida
  function openDetail(item: AttendanceSummaryItem) {
    const pending = [...item.attendanceRecords].reverse().find((record) => !record.justified)
    setSelected(item)
    setJustDate(pending?.date ?? '')
    setJustType(
      pending?.value === 'QUARTER' ? 'cuarto' : pending?.value === 'HALF' ? 'media' : 'ausente'
    )
    setJustReason('')
  }

  // Datos con la forma que espera el modal del proyecto
  const modalRecord: AttendanceRecord | null = useMemo(
    () =>
      selected
        ? {
            id: selected.studentId,
            sectionId: selected.sectionId,
            student: selected.student,
            dni: selected.dni,
            course: selected.course,
            date: justDate,
            absences: selected.absences,
            halfAbsences: selected.attendanceRecords.filter((record) => record.value === 'HALF')
              .length,
            quarterAbsences: selected.lateArrivals,
            justifications: selected.justifications,
          }
        : null,
    [selected, justDate]
  )

  // Busca la falta de esa fecha y tipo, sin justificar, y la justifica en el back
  async function handleJustify() {
    if (!selected) return
    const target = selected.attendanceRecords.find(
      (record) =>
        record.date === justDate && record.value === TYPE_TO_VALUE[justType] && !record.justified
    )
    if (!target) {
      setToast({
        severity: 'error',
        text: 'No hay una inasistencia sin justificar de ese tipo en esa fecha.',
      })
      return
    }
    try {
      await attendanceService.justify(target.id, justReason.trim())
      setToast({ severity: 'success', text: 'Justificación guardada.' })
      setJustReason('')
      const updated = await loadSummary()
      setSelected(
        updated.find(
          (item) => item.studentId === selected.studentId && item.sectionId === selected.sectionId
        ) ?? null
      )
    } catch (err: unknown) {
      setToast({
        severity: 'error',
        text: err instanceof Error ? err.message : 'No se pudo justificar',
      })
    }
  }

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 3 } }}>
        <PageHeader
          title="Resumen de asistencia"
          subtitle="Consultá el detalle de inasistencias por alumno o por curso."
          breadcrumbs={[
            { label: 'Inicio', href: '/' },
            { label: 'Asistencia' },
            { label: 'Resumen' },
          ]}
        />

        {/* Filtros de búsqueda */}
        <ContentCard sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ px: 2, py: 1.5, fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}
          >
            Filtros de búsqueda
          </Typography>
          <Stack
            sx={{ p: 2, flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}
          >
            <TextField
              size="small"
              placeholder="Buscar alumno por nombre o DNI..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleFilter()}
              sx={{ flex: 1, minWidth: 220 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FormControl size="small" sx={{ flex: 1, minWidth: 200 }}>
              <InputLabel id="lbl-summary-course">Curso</InputLabel>
              <Select
                labelId="lbl-summary-course"
                label="Curso"
                value={sectionId}
                onChange={(event) => setSectionId(event.target.value)}
                displayEmpty
              >
                <MenuItem value="">Todos</MenuItem>
                {sections.map((section) => (
                  <MenuItem key={section.id} value={section.id}>
                    {sectionLabel(section)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1, minWidth: 180 }}>
              <InputLabel id="lbl-summary-period">Período</InputLabel>
              <Select
                labelId="lbl-summary-period"
                label="Período"
                value={period}
                onChange={(event) => setPeriod(event.target.value as Period)}
              >
                {(Object.keys(PERIOD_LABELS) as Period[]).map((key) => (
                  <MenuItem key={key} value={key}>
                    {PERIOD_LABELS[key]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<FilterAltIcon />}
              onClick={handleFilter}
              sx={{
                backgroundColor: '#111827',
                px: 3,
                height: 40,
                '&:hover': { backgroundColor: '#1f2937' },
              }}
            >
              Filtrar
            </Button>
          </Stack>
        </ContentCard>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Resultados */}
        <ContentCard>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2,
              py: 1.5,
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Resultados — {resultsTitle} · {PERIOD_LABELS[applied.period]}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={
                exporting ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />
              }
              onClick={() => void handleExport()}
              disabled={exporting || total === 0}
              sx={{ borderColor: '#111827', color: '#111827' }}
            >
              Exportar
            </Button>
          </Box>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column}
                      align={column === 'Alumno' || column === 'DNI' ? 'left' : 'center'}
                      sx={{
                        fontWeight: 700,
                        fontSize: 12,
                        textTransform: 'uppercase',
                        color: '#374151',
                      }}
                    >
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      align="center"
                      sx={{ py: 4, color: '#6b7280' }}
                    >
                      No hay asistencia registrada para los filtros elegidos.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const color = percentageColor(item.attendancePercentage)
                    return (
                      <TableRow key={`${item.studentId}-${item.sectionId}`} hover>
                        <TableCell sx={{ fontWeight: 600, color: '#111827' }}>
                          {item.student}
                        </TableCell>
                        <TableCell sx={{ color: '#6b7280' }}>{item.dni}</TableCell>
                        <TableCell align="center">{item.totalClasses}</TableCell>
                        <TableCell align="center">{item.presents}</TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            color: item.absences >= HIGH_ABSENCES ? '#dc2626' : 'inherit',
                            fontWeight: item.absences >= HIGH_ABSENCES ? 700 : 400,
                          }}
                        >
                          {item.absences}
                        </TableCell>
                        <TableCell align="center">{item.justified}</TableCell>
                        <TableCell align="center">{item.lateArrivals}</TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 1,
                            }}
                          >
                            <LinearProgress
                              variant="determinate"
                              value={item.attendancePercentage}
                              sx={{
                                width: 80,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#e5e7eb',
                                '& .MuiLinearProgress-bar': { backgroundColor: color },
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700, color, minWidth: 48 }}
                            >
                              {item.attendancePercentage.toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ver detalle y justificar" arrow>
                            <IconButton size="small" onClick={() => openDetail(item)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <StandardTablePagination
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows)
              setPage(0)
            }}
            itemLabel="alumnos"
          />
        </ContentCard>

        {/* Modal de justificación del proyecto */}
        <JustificationModal
          record={modalRecord}
          reason={justReason}
          date={justDate}
          type={justType}
          onDateChange={setJustDate}
          onTypeChange={setJustType}
          onReasonChange={setJustReason}
          onAdd={() => void handleJustify()}
          onClose={() => setSelected(null)}
        />

        <Snackbar
          open={toast !== null}
          autoHideDuration={4000}
          onClose={() => setToast(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          {toast ? (
            <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>
              {toast.text}
            </Alert>
          ) : undefined}
        </Snackbar>
      </Box>
    </MainLayout>
  )
}

export default AttendanceSummaryPage
