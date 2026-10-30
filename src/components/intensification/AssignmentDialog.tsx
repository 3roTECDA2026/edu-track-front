import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { SHIFT_LABELS } from '@/components/students/studentLabels'
import type { AttendanceSection } from '@/services/attendance.service'
import {
  intensificationService,
  MODEL_LABELS,
  MODELS_WITH_LOCATION,
  type IntensificationAssignment,
  type IntensificationCandidate,
  type IntensificationModel,
} from '@/services/intensification.service'

interface AssignmentDialogProps {
  open: boolean
  // 'assign': asignar alumnos al período · 'edit': cambiar el modelo o la sección de uno asignado
  mode: 'assign' | 'edit'
  scheduleId: string
  subject: { id: string; name: string; gradeLevel: number } | null
  assignment: IntensificationAssignment | null
  sections: AttendanceSection[]
  onClose: () => void
  onSaved: (message: string) => void
}

const sectionLabel = (section: { grade: number; division: string; shift: string }) =>
  `${section.grade}° ${section.division} · ${SHIFT_LABELS[section.shift as keyof typeof SHIFT_LABELS] ?? section.shift}`

export const AssignmentDialog = ({
  open,
  mode,
  scheduleId,
  subject,
  assignment,
  sections,
  onClose,
  onSaved,
}: AssignmentDialogProps) => {
  const [candidates, setCandidates] = useState<IntensificationCandidate[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [model, setModel] = useState<IntensificationModel>('MODEL_1')
  const [targetId, setTargetId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Al abrir: en "cambiar", se cargan el modelo y la sección actuales; en "asignar", los candidatos
  useEffect(() => {
    if (!open) return
    setError(null)
    setSelected(new Set())
    if (mode === 'edit' && assignment) {
      setModel(assignment.model)
      setTargetId(assignment.targetClassSection?.id ?? '')
      return
    }
    setModel('MODEL_1')
    setTargetId('')
    if (!subject) return
    const controller = new AbortController()
    setLoading(true)
    intensificationService
      .candidates({ scheduleId, subjectId: subject.id }, controller.signal)
      .then(setCandidates)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los alumnos')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [open, mode, assignment, scheduleId, subject])

  const gradeLevel = mode === 'edit' ? assignment?.subject.gradeLevel : subject?.gradeLevel
  const needsLocation = MODELS_WITH_LOCATION.includes(model)
  // Solo se ofrecen secciones del año de la materia (el back valida igual el turno)
  const gradeSections = sections.filter((section) => section.grade === gradeLevel)

  const allSelected = candidates.length > 0 && selected.size === candidates.length
  const canSave =
    !saving && (mode === 'edit' || selected.size > 0) && (!needsLocation || Boolean(targetId))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const targetClassSectionId = needsLocation ? targetId : null
    try {
      if (mode === 'edit' && assignment) {
        await intensificationService.updatePlacement(assignment.id, { model, targetClassSectionId })
        onSaved('Modelo y ubicación actualizados.')
      } else if (subject) {
        const result = await intensificationService.assign({
          scheduleId,
          subjectId: subject.id,
          pendingSubjectIds: [...selected],
          model,
          targetClassSectionId,
        })
        onSaved(
          result.assigned === 1 ? 'Se asignó 1 alumno.' : `Se asignaron ${result.assigned} alumnos.`
        )
      }
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {mode === 'assign'
          ? `Asignar alumnos · ${subject?.name ?? ''} ${subject?.gradeLevel ?? ''}°`
          : `Modelo y ubicación · ${assignment?.student.lastName}, ${assignment?.student.firstName}`}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Alumnos con la materia pendiente (solo al asignar) */}
          {mode === 'assign' &&
            (loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : candidates.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                No hay alumnos con esta materia pendiente para asignar en este período.
              </Typography>
            ) : (
              <Box
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  maxHeight: 260,
                  overflowY: 'auto',
                }}
              >
                <FormControlLabel
                  sx={{ px: 1.5, py: 0.5, m: 0, width: '100%', borderBottom: '1px solid #e5e7eb' }}
                  control={
                    <Checkbox
                      checked={allSelected}
                      indeterminate={selected.size > 0 && !allSelected}
                      onChange={() =>
                        setSelected(
                          allSelected
                            ? new Set()
                            : new Set(candidates.map((c) => c.pendingSubjectId))
                        )
                      }
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Seleccionar todos
                    </Typography>
                  }
                />
                {candidates.map((candidate) => (
                  <FormControlLabel
                    key={candidate.pendingSubjectId}
                    sx={{ px: 1.5, m: 0, width: '100%' }}
                    control={
                      <Checkbox
                        checked={selected.has(candidate.pendingSubjectId)}
                        onChange={() => toggle(candidate.pendingSubjectId)}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {candidate.student.lastName}, {candidate.student.firstName}
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: '#6b7280', ml: 1 }}
                        >
                          {candidate.course ? sectionLabel(candidate.course) : 'Sin curso'} ·
                          pendiente de {candidate.originYear}
                        </Typography>
                      </Typography>
                    }
                  />
                ))}
              </Box>
            ))}

          {/* Modelo de intensificación (E3-RF-06) */}
          <TextField
            select
            label="Modelo"
            size="small"
            value={model}
            onChange={(event) => setModel(event.target.value as IntensificationModel)}
          >
            {(Object.keys(MODEL_LABELS) as IntensificationModel[]).map((key) => (
              <MenuItem key={key} value={key}>
                {MODEL_LABELS[key]}
              </MenuItem>
            ))}
          </TextField>

          {/* Dónde intensifica, solo en los modelos 2 y 3 (E3-RF-07) */}
          {needsLocation && (
            <TextField
              select
              label="Año, sección y turno donde intensifica"
              size="small"
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              helperText={
                model === 'MODEL_2'
                  ? `Una sección de ${gradeLevel}° año, del mismo turno del alumno.`
                  : `Una sección de ${gradeLevel}° año, de otro turno (contraturno).`
              }
            >
              {gradeSections.length === 0 ? (
                <MenuItem value="" disabled>
                  No hay secciones de {gradeLevel}° año en el ciclo
                </MenuItem>
              ) : (
                gradeSections.map((section) => (
                  <MenuItem key={section.id} value={section.id}>
                    {sectionLabel(section)}
                  </MenuItem>
                ))
              )}
            </TextField>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!canSave}
          onClick={() => void handleSave()}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {mode === 'assign' ? 'Asignar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AssignmentDialog
