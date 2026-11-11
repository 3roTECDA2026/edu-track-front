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

import {
  MODEL_LABELS,
  MODELS_BY_OPTION,
  OPTION_LABELS,
  sectionLabel,
} from '@/components/intensification/intensificationLabels'
import { useInstitutionalConfig } from '@/hooks/useInstitutionalConfig'
import type { AttendanceSection } from '@/services/attendance.service'
import {
  intensificationService,
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

  // Opción organizativa de la escuela (CRM-065): define qué modelos se pueden elegir.
  // Sin opción elegida (o si no se pudo leer), se ofrecen los 4 modelos.
  const { config, loading: loadingConfig, error: configError } = useInstitutionalConfig()
  const optionModels = config ? MODELS_BY_OPTION[config.organizationalModel] : null
  const isOutsideOption = (key: IntensificationModel) =>
    optionModels !== null && !optionModels.includes(key)
  // Al cambiar una asignación vieja, su modelo actual se sigue ofreciendo aunque haya quedado
  // afuera de la opción, para poder mantenerlo (por ejemplo, para cambiar solo la sección)
  const modelChoices = (Object.keys(MODEL_LABELS) as IntensificationModel[]).filter(
    (key) => !isOutsideOption(key) || (mode === 'edit' && assignment?.model === key)
  )

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
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los alumnos.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [open, mode, assignment, scheduleId, subject])

  const gradeLevel = mode === 'edit' ? assignment?.subject.gradeLevel : subject?.gradeLevel
  const needsLocation = MODELS_WITH_LOCATION.includes(model)

  // Turnos de los alumnos elegidos (o del alumno que se está cambiando)
  const chosenCourses =
    mode === 'edit'
      ? [assignment?.course ?? null]
      : candidates
          .filter((candidate) => selected.has(candidate.pendingSubjectId))
          .map((candidate) => candidate.course)
  const shifts = new Set(chosenCourses.flatMap((course) => (course ? [course.shift] : [])))
  const withoutCourse = chosenCourses.some((course) => course === null)

  // Modelo 2 con alumnos de turnos distintos: una sola sección no puede ser del turno de todos
  const mixedShifts = model === 'MODEL_2' && shifts.size > 1

  // Secciones posibles: del año de la materia y, según el modelo, del mismo turno (2) o de otro (3)
  const validSections = sections.filter((section) => {
    if (section.grade !== gradeLevel) return false
    if (model === 'MODEL_2') return shifts.size === 1 && shifts.has(section.shift)
    if (model === 'MODEL_3') return !shifts.has(section.shift)
    return true
  })
  // Si la sección elegida dejó de servir (cambió el modelo o los alumnos), no cuenta como elegida
  const validTargetId = validSections.some((section) => section.id === targetId) ? targetId : ''

  const allSelected = candidates.length > 0 && selected.size === candidates.length
  const canSave =
    !saving &&
    modelChoices.includes(model) &&
    (mode === 'edit' || selected.size > 0) &&
    (!needsLocation || (Boolean(validTargetId) && !mixedShifts && !withoutCourse))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Al cambiar el modelo, la sección anterior ya no sirve (por ejemplo, del 2 al 3 cambia el turno)
  function changeModel(next: IntensificationModel) {
    setModel(next)
    setTargetId('')
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const targetClassSectionId = needsLocation ? validTargetId : null
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
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
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
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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
                            : new Set(candidates.map((candidate) => candidate.pendingSubjectId))
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
                          sx={{ color: 'text.secondary', ml: 1 }}
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

          {/* Modelo de intensificación (E3-RF-06), según la opción de la escuela */}
          <TextField
            select
            label="Modelo"
            size="small"
            value={model}
            onChange={(event) => changeModel(event.target.value as IntensificationModel)}
          >
            {modelChoices.map((key) => (
              <MenuItem key={key} value={key}>
                {MODEL_LABELS[key]}
                {isOutsideOption(key) && config
                  ? ` (fuera de la opción ${OPTION_LABELS[config.organizationalModel]})`
                  : ''}
              </MenuItem>
            ))}
          </TextField>

          {/* Aviso según la opción organizativa de la escuela */}
          {!loadingConfig && config && (
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1 }}>
              La escuela tiene la opción {OPTION_LABELS[config.organizationalModel]}: se muestran
              solo sus modelos.
            </Typography>
          )}
          {!loadingConfig && !config && !configError && (
            <Alert severity="info">
              La escuela todavía no eligió su opción organizativa: se muestran los 4 modelos.
            </Alert>
          )}
          {!loadingConfig && configError && (
            <Alert severity="warning">
              No se pudo leer la opción organizativa de la escuela: se muestran los 4 modelos.
            </Alert>
          )}

          {/* Dónde intensifica, solo en los modelos 2 y 3 (E3-RF-07) */}
          {needsLocation && mixedShifts && (
            <Alert severity="warning">
              Los alumnos elegidos son de turnos distintos. En el modelo 2, la sección tiene que ser
              del mismo turno de cada uno: asignalos por separado, de a un turno.
            </Alert>
          )}
          {needsLocation && withoutCourse && (
            <Alert severity="warning">
              Hay alumnos sin curso en el ciclo activo: no se puede validar el turno. Asignalos con
              el modelo 1 o el 4, o primero inscribilos en un curso.
            </Alert>
          )}
          {needsLocation && !mixedShifts && !withoutCourse && (
            <TextField
              select
              label="Año, sección y turno donde intensifica"
              size="small"
              value={validTargetId}
              onChange={(event) => setTargetId(event.target.value)}
              helperText={
                model === 'MODEL_2'
                  ? `Secciones de ${gradeLevel}° año del mismo turno del alumno.`
                  : `Secciones de ${gradeLevel}° año de otro turno (contraturno).`
              }
            >
              {validSections.length === 0 ? (
                <MenuItem value="" disabled>
                  No hay secciones de {gradeLevel}° año que sirvan para este modelo
                </MenuItem>
              ) : (
                validSections.map((section) => (
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
          {saving ? 'Guardando...' : mode === 'assign' ? 'Asignar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AssignmentDialog
