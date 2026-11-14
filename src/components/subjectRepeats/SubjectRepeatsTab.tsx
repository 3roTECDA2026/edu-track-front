import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import RepeatIcon from '@mui/icons-material/Repeat'

import { AddButton } from '@/components/common/AddButton'
import { EditButton } from '@/components/common/EditButton'
import { useNotify } from '@/components/layout/NotificationProvider'
import { TabEmpty, TabError, TabLoading } from '@/components/studentProfile/TabStates'
import { bodyCellSx, cardSx, headerCellSx } from '@/components/studentProfile/profileStyles'
import { SubjectRepeatDialog } from '@/components/subjectRepeats/SubjectRepeatDialog'
import { SHIFT_LABELS } from '@/components/students/studentLabels'
import {
  repeatOrigin,
  sectionLabel,
  sectionName,
  subjectCountLabel,
  subjectLimitReached,
} from '@/components/subjectRepeats/subjectRepeatLabels'
import { useLazyResource } from '@/hooks/useLazyResource'
import {
  deleteRepeat,
  getRepeatOptions,
  listStudentRepeats,
  type SubjectRepeat,
} from '@/services/subjectRepeats.service'

interface SubjectRepeatsTabProps {
  studentId: string
  studentName: string
  // Administración, dirección y EOE/directivos: asignan, cambian la sección y quitan
  canManage: boolean
}

// Motivo por el que un recursado no se puede quitar (igual que el back), o null
const deleteBlockReason = (repeat: SubjectRepeat) =>
  repeat.pateId
    ? 'Lo creó un PATE: no se puede quitar desde acá'
    : repeat.hasGrade
      ? 'Ya tiene notas cargadas'
      : repeat.attendanceCount > 0
        ? 'Ya tiene asistencias cargadas'
        : null

// Materias a recursar del alumno (CRM-082, CRM-083, E4-RF-09)
export const SubjectRepeatsTab = ({
  studentId,
  studentName,
  canManage,
}: SubjectRepeatsTabProps) => {
  const notify = useNotify()
  const repeats = useLazyResource(`subject-repeats:${studentId}`, (signal) =>
    listStudentRepeats(studentId, signal)
  )
  // Contador de materias del ciclo (CRM-083): solo quien gestiona puede pedir las opciones
  const counter = useLazyResource(canManage ? `repeat-counter:${studentId}` : null, (signal) =>
    getRepeatOptions(studentId, signal)
  )
  const limitReached = counter.data ? subjectLimitReached(counter.data) : false
  // null: cerrado · 'new': alta · un recursado: cambio de sección
  const [dialog, setDialog] = useState<SubjectRepeat | 'new' | null>(null)
  const [removing, setRemoving] = useState<SubjectRepeat | null>(null)
  const [removingWorking, setRemovingWorking] = useState(false)

  // Después de asignar o quitar cambia el total de materias del ciclo
  const reloadAll = () => {
    repeats.reload()
    if (canManage) counter.reload()
  }

  const handleSaved = (message: string) => {
    notify.success(message)
    reloadAll()
  }

  async function handleRemove() {
    if (!removing) return
    setRemovingWorking(true)
    try {
      await deleteRepeat(removing.id)
      notify.success(`Se quitó el recursado de ${removing.subject.name}.`)
      setRemoving(null)
      reloadAll()
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'No se pudo quitar el recursado.')
    } finally {
      setRemovingWorking(false)
    }
  }

  const renderList = () => {
    if (repeats.loading && !repeats.data) return <TabLoading />
    if (repeats.error) return <TabError message={repeats.error} onRetry={repeats.reload} />
    if (!repeats.data || repeats.data.length === 0) {
      return (
        <TabEmpty
          icon={<RepeatIcon />}
          title="Sin recursados"
          text="El alumno no recursa materias."
        />
      )
    }
    return (
      <TableContainer component={Paper} variant="outlined" sx={cardSx}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#fafafa' }}>
            <TableRow>
              <TableCell sx={headerCellSx}>Materia</TableCell>
              <TableCell align="center" sx={headerCellSx}>
                Año
              </TableCell>
              <TableCell sx={headerCellSx}>Sección</TableCell>
              <TableCell sx={headerCellSx}>Turno</TableCell>
              <TableCell align="center" sx={headerCellSx}>
                Ciclo
              </TableCell>
              <TableCell sx={headerCellSx}>Origen</TableCell>
              <TableCell sx={headerCellSx}>MPAA</TableCell>
              {canManage && (
                <TableCell align="right" sx={headerCellSx}>
                  Acciones
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {repeats.data.map((repeat) => {
              const accredited = repeat.pendingSubject?.status === 'ACCREDITED'
              const blockReason = deleteBlockReason(repeat)
              return (
                <TableRow key={repeat.id} hover>
                  <TableCell sx={{ ...bodyCellSx, fontWeight: 700 }}>
                    {repeat.subject.name}
                  </TableCell>
                  <TableCell align="center" sx={bodyCellSx}>
                    {repeat.subject.gradeLevel}°
                  </TableCell>
                  <TableCell sx={bodyCellSx}>{sectionName(repeat.classSection)}</TableCell>
                  <TableCell sx={bodyCellSx}>{SHIFT_LABELS[repeat.classSection.shift]}</TableCell>
                  <TableCell align="center" sx={bodyCellSx}>
                    {repeat.academicYear.year}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={repeat.pateId ? 'primary' : 'default'}
                      label={repeatOrigin(repeat)}
                    />
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    {repeat.pendingSubject
                      ? `Pendiente de ${repeat.pendingSubject.originYear}${accredited ? ' · acreditada' : ''}`
                      : '—'}
                  </TableCell>
                  {canManage && (
                    <TableCell align="right" sx={bodyCellSx}>
                      {/* Con la MPAA acreditada, el recursado ya terminó: no se edita */}
                      {!accredited && (
                        <Box sx={{ display: 'inline-flex', gap: 1, alignItems: 'center' }}>
                          <EditButton
                            label={`Editar recursado de ${repeat.subject.name}`}
                            onClick={() => setDialog(repeat)}
                          />
                          <Tooltip title={blockReason ?? ''}>
                            <span>
                              <Button
                                size="small"
                                color="error"
                                disabled={blockReason !== null}
                                onClick={() => setRemoving(repeat)}
                              >
                                Quitar
                              </Button>
                            </span>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6">Materias a recursar</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Se califican y se toma asistencia como cualquier materia. En la grilla y en el RITE
            figuran con la marca R.
          </Typography>
        </Box>
        {canManage && counter.data && (
          <Tooltip title="Materias del alumno en el ciclo activo, cursadas y recursadas">
            <Chip
              label={`Materias del ciclo: ${subjectCountLabel(counter.data)}`}
              color={limitReached ? 'error' : 'default'}
              variant="outlined"
            />
          </Tooltip>
        )}
        {canManage && (
          <Tooltip
            title={
              limitReached
                ? `Llegó al máximo de ${counter.data?.maxSubjects} materias del ciclo`
                : ''
            }
          >
            <span>
              <AddButton
                label="Asignar recursado"
                onClick={() => setDialog('new')}
                // Si el contador no llega, el alta sigue disponible: el back igual valida el límite
                disabled={limitReached}
              />
            </span>
          </Tooltip>
        )}
      </Box>

      {renderList()}

      {dialog !== null && (
        <SubjectRepeatDialog
          key={dialog === 'new' ? 'new' : dialog.id}
          open
          studentId={studentId}
          studentName={studentName}
          repeat={dialog === 'new' ? null : dialog}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Confirmación para quitar: mientras se procesa, no se cierra */}
      <Dialog
        open={removing !== null}
        onClose={() => !removingWorking && setRemoving(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {removing ? `¿Quitar el recursado de ${removing.subject.name}?` : ''}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {studentName} deja de recursar la materia en{' '}
            {removing ? sectionLabel(removing.classSection) : ''}. La materia sigue como pendiente
            (MPAA) y se puede volver a asignar.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRemoving(null)} color="inherit" disabled={removingWorking}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            disableElevation
            disabled={removingWorking}
            onClick={() => void handleRemove()}
          >
            {removingWorking ? 'Quitando...' : 'Quitar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SubjectRepeatsTab
