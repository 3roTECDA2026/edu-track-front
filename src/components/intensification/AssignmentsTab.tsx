import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import { ContentCard } from '@/components/common/ContentCard'
import { AddButton } from '@/components/common/AddButton'
import { EditButton } from '@/components/common/EditButton'
import { StandardTablePagination } from '@/components/common/StandardTablePagination'
import AssignmentDialog from '@/components/intensification/AssignmentDialog'
import {
  MODEL_SHORT_LABELS,
  PERIOD_LABELS,
  sectionLabel,
} from '@/components/intensification/intensificationLabels'
import { useIntensifications } from '@/hooks/useIntensifications'
import { attendanceService, type AttendanceSection } from '@/services/attendance.service'
import {
  intensificationService,
  type IntensificationAssignment,
} from '@/services/intensification.service'
import type { IntensificationSchedule } from '@/services/intensificationSchedule.service'

const columns = [
  'Alumno',
  'DNI',
  'Curso',
  'Materia',
  'Modelo',
  'Dónde intensifica',
  'Docente',
  'Resultado',
]

const studentName = (item: IntensificationAssignment) =>
  `${item.student.lastName}, ${item.student.firstName}`

interface AssignmentsTabProps {
  // Períodos del ciclo elegido (los carga la pantalla de Intensificación)
  schedules: IntensificationSchedule[]
  canEdit: boolean
  onMessage: (message: string, severity: 'success' | 'error') => void
  // Avisa a la pantalla para actualizar la cantidad de alumnos asignados de cada período
  onChanged: () => void
}

type DialogState = { mode: 'assign' } | { mode: 'edit'; assignment: IntensificationAssignment }

// Asignación de alumnos con materias pendientes a los períodos de intensificación (E3-RF-05, 06 y 07)
export const AssignmentsTab = ({
  schedules,
  canEdit,
  onMessage,
  onChanged,
}: AssignmentsTabProps) => {
  const [scheduleId, setScheduleId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [classSectionId, setClassSectionId] = useState('')
  const [sections, setSections] = useState<AttendanceSection[]>([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [toRemove, setToRemove] = useState<IntensificationAssignment | null>(null)
  const [removing, setRemoving] = useState(false)

  const { items, loading, error, reload } = useIntensifications({
    scheduleId,
    subjectId,
    classSectionId,
  })

  // Si el período elegido no está en el ciclo, se elige el primero
  useEffect(() => {
    if (!schedules.some((schedule) => schedule.id === scheduleId)) {
      setScheduleId(schedules[0]?.id ?? '')
      setSubjectId('')
      setPage(0)
    }
  }, [schedules, scheduleId])

  // Secciones del ciclo activo, para el filtro de curso y la ubicación de los modelos 2 y 3
  useEffect(() => {
    const controller = new AbortController()
    attendanceService
      .getSummarySections(controller.signal)
      .then(setSections)
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  const schedule = schedules.find((item) => item.id === scheduleId)
  const scheduleSubject = schedule?.subjects.find((entry) => entry.subjectId === subjectId)
  const subject = useMemo(
    () =>
      scheduleSubject
        ? {
            id: scheduleSubject.subjectId,
            name: scheduleSubject.subjectName,
            gradeLevel: scheduleSubject.gradeLevel,
          }
        : null,
    [scheduleSubject]
  )

  // Si después de quitar a alguien la página quedó vacía, se muestra la última que tiene datos
  const lastPage = Math.max(0, Math.ceil(items.length / rowsPerPage) - 1)
  const currentPage = Math.min(page, lastPage)
  const pageItems = items.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage)

  function refresh(message: string) {
    onMessage(message, 'success')
    reload()
    onChanged()
  }

  async function handleRemove() {
    if (!toRemove) return
    setRemoving(true)
    try {
      await intensificationService.remove(toRemove.id)
      setToRemove(null)
      refresh('Asignación quitada.')
    } catch (err: unknown) {
      onMessage(err instanceof Error ? err.message : 'No se pudo quitar la asignación.', 'error')
    } finally {
      setRemoving(false)
    }
  }

  if (schedules.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Todavía no hay períodos configurados en este ciclo. Configuralos en la pestaña Calendario.
        </Typography>
      </Box>
    )
  }

  return (
    <>
      {/* Una sola tarjeta: filtros arriba, tabla y paginado, como en Estudiantes */}
      <ContentCard>
        <Stack
          sx={{
            p: 2,
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            alignItems: 'center',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <FormControl size="small" sx={{ flex: 1, minWidth: 180 }}>
            <InputLabel id="lbl-assign-period">Período</InputLabel>
            <Select
              labelId="lbl-assign-period"
              label="Período"
              value={scheduleId}
              onChange={(event) => {
                setScheduleId(event.target.value)
                setSubjectId('')
                setPage(0)
              }}
            >
              {schedules.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {PERIOD_LABELS[item.period]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ flex: 1, minWidth: 200 }}>
            {/* shrink + notched: la etiqueta queda arriba aunque el valor sea "Todas" (vacío) */}
            <InputLabel id="lbl-assign-subject" shrink>
              Materia
            </InputLabel>
            <Select
              labelId="lbl-assign-subject"
              label="Materia"
              notched
              displayEmpty
              value={subjectId}
              onChange={(event) => {
                setSubjectId(event.target.value)
                setPage(0)
              }}
            >
              <MenuItem value="">Todas</MenuItem>
              {schedule?.subjects.map((entry) => (
                <MenuItem key={entry.subjectId} value={entry.subjectId}>
                  {entry.subjectName} · {entry.gradeLevel}° año
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ flex: 1, minWidth: 180 }}>
            <InputLabel id="lbl-assign-course" shrink>
              Curso
            </InputLabel>
            <Select
              labelId="lbl-assign-course"
              label="Curso"
              notched
              displayEmpty
              value={classSectionId}
              onChange={(event) => {
                setClassSectionId(event.target.value)
                setPage(0)
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {sections.map((section) => (
                <MenuItem key={section.id} value={section.id}>
                  {sectionLabel(section)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {canEdit && (
            <Tooltip title={subject ? '' : 'Elegí una materia para asignar alumnos'} arrow>
              <span>
                <AddButton
                  label="Asignar alumnos"
                  icon={<AddIcon />}
                  disabled={!subject}
                  onClick={() => setDialog({ mode: 'assign' })}
                />
              </span>
            </Tooltip>
          )}
        </Stack>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 980 }}>
            <TableHead sx={{ backgroundColor: '#fafafa' }}>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column}>{column}</TableCell>
                ))}
                {canEdit && <TableCell align="right">Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} sx={{ py: 3 }}>
                    <Alert severity="error">{error}</Alert>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    align="center"
                    sx={{ py: 4, color: 'text.secondary' }}
                  >
                    Todavía no hay alumnos asignados con estos filtros.
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {studentName(item)}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{item.student.dni}</TableCell>
                    <TableCell>{item.course ? sectionLabel(item.course) : '—'}</TableCell>
                    <TableCell>
                      {item.subject.name} · {item.subject.gradeLevel}°
                    </TableCell>
                    <TableCell>{MODEL_SHORT_LABELS[item.model]}</TableCell>
                    <TableCell>
                      {item.targetClassSection ? sectionLabel(item.targetClassSection) : '—'}
                    </TableCell>
                    <TableCell
                      sx={{ color: item.responsibleTeacher ? 'text.primary' : 'text.secondary' }}
                    >
                      {item.responsibleTeacher?.name ?? 'Sin asignar'}
                    </TableCell>
                    <TableCell>
                      {item.resultCode ? (
                        <Chip
                          size="small"
                          label={`${item.resultCode}${item.score ? ` · ${item.score}` : ''}`}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Pendiente
                        </Typography>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell align="right">
                        {/* Con resultado cargado, ya no se cambia ni se quita la asignación */}
                        {item.resultCode ? (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            —
                          </Typography>
                        ) : (
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                            <EditButton
                              label="Cambiar modelo y ubicación"
                              onClick={() => setDialog({ mode: 'edit', assignment: item })}
                            />
                            <Tooltip title="Quitar asignación" arrow>
                              <IconButton size="small" onClick={() => setToRemove(item)}>
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <StandardTablePagination
          count={items.length}
          page={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows)
            setPage(0)
          }}
          itemLabel="alumnos"
          sx={{ borderTop: '1px solid #e5e7eb' }}
        />
      </ContentCard>

      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 1.5 }}>
        El período y el docente responsable se toman del calendario. El resultado lo carga el
        docente en la carga de resultados.
      </Typography>

      <AssignmentDialog
        open={dialog !== null}
        mode={dialog?.mode ?? 'assign'}
        scheduleId={scheduleId}
        subject={subject}
        assignment={dialog?.mode === 'edit' ? dialog.assignment : null}
        sections={sections}
        onClose={() => setDialog(null)}
        onSaved={refresh}
      />

      {/* Confirmación para quitar: mientras se procesa, no se cierra (estándar §7) */}
      <Dialog
        open={toRemove !== null}
        onClose={() => !removing && setToRemove(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          ¿Quitar a {toRemove ? studentName(toRemove) : ''} del período?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            La materia sigue pendiente y se puede volver a asignar a este período o a otro.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToRemove(null)} color="inherit" disabled={removing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            disableElevation
            disabled={removing}
            onClick={() => void handleRemove()}
          >
            {removing ? 'Quitando...' : 'Quitar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AssignmentsTab
