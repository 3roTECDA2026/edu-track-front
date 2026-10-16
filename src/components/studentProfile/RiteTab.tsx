import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import DescriptionIcon from '@mui/icons-material/Description'
import DownloadIcon from '@mui/icons-material/Download'
import DrawIcon from '@mui/icons-material/Draw'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import SaveIcon from '@mui/icons-material/Save'

import { AddButton } from '@/components/common/AddButton'
import { SoftBadge } from '@/components/studentProfile/SoftBadge'
import { TabEmpty, TabError, TabLoading } from '@/components/studentProfile/TabStates'
import {
  COLORS,
  bodyCellSx,
  cardSx,
  headerCellSx,
  labelSx,
} from '@/components/studentProfile/profileStyles'
import {
  ASSESSMENT_CONFIG,
  EMPTY,
  PASSING_SCORE,
  formatAbsences,
  formatDate,
} from '@/components/studentProfile/profileLabels'
import { SHIFT_LABELS } from '@/components/students/studentLabels'
import { useLazyResource } from '@/hooks/useLazyResource'
import type { PreliminaryAssessment } from '@/services/studentProfile.service'
import { getStudentHistory } from '@/services/studentProfile.service'
import {
  closeRite,
  createRite,
  getRite,
  getStudentRites,
  reopenRite,
  signRite,
  updateRiteNotes,
  type RiteDetail,
  type RiteStatus,
  type RiteTerm,
} from '@/services/rite.service'
import { downloadRitePdf } from '@/utils/ritePdf'

const STATUS_CONFIG: Record<RiteStatus, { label: string; color: string; background: string }> = {
  DRAFT: { label: 'Borrador', color: '#b06000', background: '#fef7e0' },
  CLOSED: { label: 'Cerrado', color: '#1e40af', background: '#dbeafe' },
  SIGNED: { label: 'Firmado', color: '#15803d', background: '#dcfce7' },
}

const TERM_LABELS: Record<RiteTerm, string> = {
  FIRST: '1° cuatrimestre',
  SECOND: '2° cuatrimestre',
}

const SUBJECT_COLUMNS = [
  'Tipo',
  'Materia',
  'Año',
  '1° Val.',
  'Calif. 1° C',
  '2° Val.',
  'Calif. 2° C',
  'Final',
  'Observaciones',
]

interface MessageState {
  text: string
  severity: 'success' | 'error'
}

const StatusBadge = ({ status }: { status: RiteStatus }) => (
  <SoftBadge
    label={STATUS_CONFIG[status].label}
    color={STATUS_CONFIG[status].color}
    background={STATUS_CONFIG[status].background}
  />
)

const Assessment = ({ value }: { value: PreliminaryAssessment | null }) => {
  if (!value) return <>{EMPTY}</>
  const config = ASSESSMENT_CONFIG[value]
  return (
    <SoftBadge
      label={value}
      color={config.color}
      background={config.background}
      title={config.description}
    />
  )
}

// Las notas por debajo de la aprobación se resaltan en rojo.
const Score = ({ value }: { value: number | null }) => {
  if (value === null) return <>{EMPTY}</>
  const failing = value < PASSING_SCORE
  return (
    <Box
      component="span"
      sx={{ fontWeight: failing ? 700 : 500, color: failing ? COLORS.danger : 'inherit' }}
    >
      {value}
    </Box>
  )
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <Box>
    <Typography sx={{ ...labelSx, mb: 0.25 }}>{label}</Typography>
    <Typography variant="body2" sx={{ color: COLORS.ink, fontWeight: 500 }}>
      {value}
    </Typography>
  </Box>
)

interface RiteDocumentViewProps {
  detail: RiteDetail
  notesText: string
  onNotesChange: (text: string) => void
  onSaveNotes: () => void
  saving: boolean
}

// Muestra en pantalla los mismos datos que lleva el PDF.
const RiteDocumentView = ({
  detail,
  notesText,
  onNotesChange,
  onSaveNotes,
  saving,
}: RiteDocumentViewProps) => {
  const { rite, document: doc } = detail
  const editable = rite.status === 'DRAFT'
  const section = doc.section

  return (
    <>
      <Paper variant="outlined" sx={{ ...cardSx, p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Datos generales
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          }}
        >
          <Field
            label="Institución"
            value={`${doc.institution.name} N° ${doc.institution.number}`}
          />
          <Field label="Distrito" value={doc.institution.district} />
          <Field label="Ciclo lectivo" value={String(doc.academicYear)} />
          <Field label="Estudiante" value={`${doc.student.lastName}, ${doc.student.firstName}`} />
          <Field label="DNI" value={doc.student.dni} />
          <Field
            label="Año, sección y turno"
            value={
              section
                ? `${section.grade}° ${section.division} · ${SHIFT_LABELS[section.shift]}`
                : EMPTY
            }
          />
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ ...cardSx, overflow: 'hidden' }}>
        <Typography variant="h6" sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
          Materias
        </Typography>
        {doc.subjects.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', px: 2.5, pb: 2.5 }}>
            El estudiante no tiene materias inscriptas en este ciclo lectivo.
          </Typography>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  {SUBJECT_COLUMNS.map((column) => (
                    <TableCell
                      key={column}
                      align={column === 'Materia' || column === 'Observaciones' ? 'left' : 'center'}
                      sx={headerCellSx}
                    >
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {doc.subjects.map((subject) => (
                  <TableRow key={subject.enrollmentId} hover>
                    <TableCell align="center" sx={bodyCellSx}>
                      {subject.type}
                    </TableCell>
                    <TableCell sx={{ ...bodyCellSx, fontWeight: 700, color: COLORS.ink }}>
                      {subject.subjectName}
                    </TableCell>
                    <TableCell align="center" sx={bodyCellSx}>
                      {subject.gradeLevel}°
                    </TableCell>
                    <TableCell align="center" sx={bodyCellSx}>
                      <Assessment value={subject.term1.preliminaryAssessment} />
                    </TableCell>
                    <TableCell align="center" sx={bodyCellSx}>
                      <Score value={subject.term1.score} />
                    </TableCell>
                    <TableCell align="center" sx={bodyCellSx}>
                      <Assessment value={subject.term2?.preliminaryAssessment ?? null} />
                    </TableCell>
                    <TableCell align="center" sx={bodyCellSx}>
                      <Score value={subject.term2?.score ?? null} />
                    </TableCell>
                    <TableCell align="center" sx={bodyCellSx}>
                      <Score value={subject.finalScore} />
                    </TableCell>
                    <TableCell sx={{ ...bodyCellSx, minWidth: 200 }}>
                      <Typography variant="body2">
                        1° C: {subject.term1.observations || EMPTY}
                      </Typography>
                      <Typography variant="body2">
                        2° C: {subject.term2?.observations || EMPTY}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Box
        sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}
      >
        <Paper variant="outlined" sx={{ ...cardSx, p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Inasistencias
          </Typography>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <Field
              label="1° cuatrimestre"
              value={`${formatAbsences(doc.attendance.term1.absences)} de ${doc.attendance.term1.schoolDays} días`}
            />
            <Field
              label="2° cuatrimestre"
              value={
                doc.attendance.term2
                  ? `${formatAbsences(doc.attendance.term2.absences)} de ${doc.attendance.term2.schoolDays} días`
                  : EMPTY
              }
            />
            <Field
              label="Total"
              value={`${formatAbsences(doc.attendance.totalAbsences)} de ${doc.attendance.totalSchoolDays} días`}
            />
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ ...cardSx, p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Notificaciones
          </Typography>
          {(['FIRST', 'SECOND'] as RiteTerm[]).map((termKey) => {
            const notification = doc.notifications.find((item) => item.term === termKey)
            return (
              <Box
                key={termKey}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 120 }}>
                  {TERM_LABELS[termKey]}
                </Typography>
                {notification ? (
                  <>
                    <StatusBadge status={notification.status} />
                    {notification.signedAt && (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {formatDate(notification.signedAt)} · {notification.signedBy ?? EMPTY}
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Sin RITE
                  </Typography>
                )}
              </Box>
            )
          })}
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ ...cardSx, p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Observaciones generales
        </Typography>
        <TextField
          multiline
          minRows={3}
          fullWidth
          disabled={!editable}
          placeholder="Apreciación general del equipo docente..."
          value={notesText}
          onChange={(event) => onNotesChange(event.target.value.slice(0, 2000))}
          helperText={
            editable
              ? `${notesText.length}/2000 caracteres`
              : 'El RITE no está en borrador: las observaciones ya no se pueden modificar.'
          }
        />
        {editable && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
            <Button
              variant="contained"
              disableElevation
              startIcon={<SaveIcon />}
              disabled={saving}
              onClick={onSaveNotes}
            >
              Guardar observaciones
            </Button>
          </Box>
        )}
      </Paper>
    </>
  )
}

interface RiteTabProps {
  studentId: string
}

export const RiteTab = ({ studentId }: RiteTabProps) => {
  const [year, setYear] = useState<number | null>(null)
  const [term, setTerm] = useState<RiteTerm>('FIRST')
  const [working, setWorking] = useState(false)
  const [notesDraft, setNotesDraft] = useState<{ riteId: string; text: string } | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)

  const history = useLazyResource(`rite-history:${studentId}`, (signal) =>
    getStudentHistory(studentId, signal)
  )
  const rites = useLazyResource(`rites:${studentId}`, (signal) =>
    getStudentRites(studentId, signal)
  )

  // Años en los que el alumno estuvo inscripto, del más reciente al más viejo.
  const years = useMemo(
    () => [...new Set((history.data ?? []).map((item) => item.year))].sort((a, b) => b - a),
    [history.data]
  )
  const selectedYear = year ?? years[0] ?? null
  const selectedRite =
    rites.data?.find((item) => item.academicYear === selectedYear && item.term === term) ?? null

  // La clave incluye la fecha de actualización: cuando el RITE cambia, se vuelve a pedir el detalle.
  const detail = useLazyResource(
    selectedRite ? `rite:${selectedRite.id}:${selectedRite.updatedAt}` : null,
    (signal) => getRite(selectedRite?.id ?? '', signal)
  )

  const notesText =
    notesDraft && notesDraft.riteId === selectedRite?.id
      ? notesDraft.text
      : (detail.data?.rite.generalNotes ?? '')

  // Ejecuta una acción (crear, cerrar, firmar...), avisa el resultado y recarga la lista.
  const runAction = async (action: () => Promise<unknown>, successText: string) => {
    setWorking(true)
    try {
      await action()
      setMessage({ text: successText, severity: 'success' })
      setNotesDraft(null)
      rites.reload()
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : 'No se pudo completar la acción',
        severity: 'error',
      })
    } finally {
      setWorking(false)
    }
  }

  if ((history.loading && !history.data) || (rites.loading && !rites.data)) return <TabLoading />
  if (history.error) return <TabError message={history.error} onRetry={history.reload} />
  if (rites.error) return <TabError message={rites.error} onRetry={rites.reload} />
  if (years.length === 0) {
    return (
      <TabEmpty
        icon={<DescriptionIcon />}
        title="Sin inscripciones"
        text="El estudiante no tiene inscripciones, así que todavía no se puede generar un RITE."
      />
    )
  }

  const data = detail.data

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {/* Selección del período y acciones según el estado del RITE */}
      <Paper
        variant="outlined"
        sx={{ ...cardSx, p: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}
      >
        <TextField
          select
          size="small"
          label="Ciclo lectivo"
          value={selectedYear ?? ''}
          onChange={(event) => setYear(Number(event.target.value))}
          sx={{ minWidth: 140 }}
        >
          {years.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Cuatrimestre"
          value={term}
          onChange={(event) => setTerm(event.target.value as RiteTerm)}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="FIRST">{TERM_LABELS.FIRST}</MenuItem>
          <MenuItem value="SECOND">{TERM_LABELS.SECOND}</MenuItem>
        </TextField>
        {selectedRite && <StatusBadge status={selectedRite.status} />}

        <Box sx={{ flexGrow: 1 }} />

        {selectedRite && data && (
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<DownloadIcon />}
            onClick={() =>
              downloadRitePdf(data.document, data.rite.status).catch(() =>
                setMessage({ text: 'No se pudo generar el PDF.', severity: 'error' })
              )
            }
          >
            Descargar PDF
          </Button>
        )}
        {selectedRite && selectedRite.status === 'DRAFT' && (
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<LockIcon />}
            disabled={working}
            onClick={() => runAction(() => closeRite(selectedRite.id), 'RITE cerrado.')}
          >
            Cerrar
          </Button>
        )}
        {selectedRite && selectedRite.status === 'CLOSED' && (
          <>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<LockOpenIcon />}
              disabled={working}
              onClick={() => runAction(() => reopenRite(selectedRite.id), 'RITE reabierto.')}
            >
              Reabrir
            </Button>
            <Button
              variant="contained"
              disableElevation
              startIcon={<DrawIcon />}
              disabled={working}
              onClick={() => runAction(() => signRite(selectedRite.id), 'RITE firmado.')}
            >
              Firmar
            </Button>
          </>
        )}
      </Paper>

      {!selectedRite ? (
        <Box
          sx={{
            py: 6,
            px: 2,
            textAlign: 'center',
            border: `1px dashed ${COLORS.border}`,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Todavía no hay RITE para este período
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Se completa automáticamente con las notas y la asistencia cargadas en el sistema.
          </Typography>
          <AddButton
            label="Crear RITE"
            disabled={working || selectedYear === null}
            onClick={() => {
              if (selectedYear === null) return
              void runAction(
                () => createRite({ studentId, year: selectedYear, term }),
                'RITE creado en borrador.'
              )
            }}
          />
        </Box>
      ) : detail.loading && !data ? (
        <TabLoading />
      ) : detail.error ? (
        <TabError message={detail.error} onRetry={detail.reload} />
      ) : data ? (
        <RiteDocumentView
          detail={data}
          notesText={notesText}
          onNotesChange={(text) => setNotesDraft({ riteId: selectedRite.id, text })}
          onSaveNotes={() =>
            runAction(
              () => updateRiteNotes(selectedRite.id, notesText),
              'Observaciones guardadas.'
            )
          }
          saving={working}
        />
      ) : null}

      {/* Historial de RITEs del alumno (E2-RF-13) */}
      {rites.data && rites.data.length > 0 && (
        <Paper variant="outlined" sx={{ ...cardSx, overflow: 'hidden' }}>
          <Typography variant="h6" sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
            Historial de RITEs
          </Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  {['Ciclo lectivo', 'Cuatrimestre', 'Estado', 'Firmado', ''].map((column) => (
                    <TableCell key={column} sx={headerCellSx}>
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rites.data.map((item) => (
                  <TableRow key={item.id} hover selected={item.id === selectedRite?.id}>
                    <TableCell sx={{ ...bodyCellSx, fontWeight: 700, color: COLORS.ink }}>
                      {item.academicYear}
                    </TableCell>
                    <TableCell sx={bodyCellSx}>{TERM_LABELS[item.term]}</TableCell>
                    <TableCell sx={bodyCellSx}>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell sx={bodyCellSx}>
                      {item.signedAt ? `${formatDate(item.signedAt)} · ${item.signedBy ?? ''}` : EMPTY}
                    </TableCell>
                    <TableCell align="right" sx={bodyCellSx}>
                      <Button
                        size="small"
                        color="inherit"
                        onClick={() => {
                          setYear(item.academicYear)
                          setTerm(item.term)
                        }}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Snackbar
        open={message !== null}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {message ? (
          <Alert severity={message.severity} variant="filled" onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  )
}

export default RiteTab