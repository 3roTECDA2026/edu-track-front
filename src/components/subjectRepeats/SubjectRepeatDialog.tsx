import { useState } from 'react'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'

import { sectionLabel } from '@/components/subjectRepeats/subjectRepeatLabels'
import { useLazyResource } from '@/hooks/useLazyResource'
import {
  createRepeat,
  getRepeatOptions,
  updateRepeatSection,
  type SubjectRepeat,
} from '@/services/subjectRepeats.service'

interface SubjectRepeatDialogProps {
  open: boolean
  studentId: string
  studentName: string
  // Sin recursado: alta. Con recursado: cambio de sección
  repeat: SubjectRepeat | null
  onClose: () => void
  onSaved: (message: string) => void
}

// Alta de un recursado y cambio de sección (CRM-082). Se recursa una MPAA del alumno en una
// sección del ciclo activo del año de la materia; puede ser de otro turno (contraturno).
export const SubjectRepeatDialog = ({
  open,
  studentId,
  studentName,
  repeat,
  onClose,
  onSaved,
}: SubjectRepeatDialogProps) => {
  const editing = repeat !== null
  // Las opciones se piden recién cuando se abre el diálogo
  const options = useLazyResource(open ? `repeat-options:${studentId}` : null, (signal) =>
    getRepeatOptions(studentId, signal)
  )
  // El padre monta el diálogo al abrirlo (con una key por recursado), así el estado arranca
  // con los datos del recursado sin tener que reiniciarlo en un efecto
  const [pendingSubjectId, setPendingSubjectId] = useState(repeat?.pendingSubject?.id ?? '')
  const [classSectionId, setClassSectionId] = useState(repeat?.classSection.id ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allOptions = options.data?.options ?? []
  const selected = allOptions.find((option) => option.pendingSubjectId === pendingSubjectId)
  const sections = selected?.sections ?? []
  const validSectionId = sections.some((section) => section.id === classSectionId)
    ? classSectionId
    : ''
  const unchanged = editing && validSectionId === repeat.classSection.id
  const canSave = Boolean(selected && validSectionId) && !unchanged && !saving
  const loadingOptions = options.loading && !options.data
  // Al editar, la MPAA tiene que seguir entre las opciones (pendiente) para ofrecer secciones
  const editUnavailable = editing && options.data !== undefined && !selected

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await updateRepeatSection(repeat.id, validSectionId)
        onSaved(`${selected.subject.name}: se cambió la sección del recursado.`)
      } else {
        await createRepeat({
          pendingSubjectId: selected.pendingSubjectId,
          classSectionId: validSectionId,
        })
        onSaved(`${studentName} recursa ${selected.subject.name}.`)
      }
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el recursado.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {editing
          ? `Cambiar sección del recursado · ${studentName}`
          : `Asignar recursado · ${studentName}`}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {options.data && (
            <Alert severity="info">
              Ciclo lectivo {options.data.activeCycle.year}. La sección puede ser de otro turno
              (contraturno).
            </Alert>
          )}
          <TextField
            select
            label="Materia pendiente (MPAA)"
            size="small"
            value={selected ? pendingSubjectId : ''}
            onChange={(event) => {
              setPendingSubjectId(event.target.value)
              setClassSectionId('')
            }}
            disabled={editing || loadingOptions}
            helperText={loadingOptions ? 'Cargando materias pendientes...' : ' '}
          >
            {allOptions.length === 0 ? (
              <MenuItem value="" disabled>
                El alumno no tiene materias pendientes
              </MenuItem>
            ) : (
              allOptions.map((option) => (
                <MenuItem
                  key={option.pendingSubjectId}
                  value={option.pendingSubjectId}
                  // Al editar se muestra la propia, aunque figure como "ya recursa"
                  disabled={!editing && option.blockReason !== null}
                >
                  <ListItemText
                    primary={`${option.subject.name} (${option.gradeLevel}.º año, pendiente de ${option.originYear})`}
                    secondary={editing ? null : option.blockReason}
                  />
                </MenuItem>
              ))
            )}
          </TextField>
          <TextField
            select
            label="Sección donde recursa"
            size="small"
            value={validSectionId}
            onChange={(event) => setClassSectionId(event.target.value)}
            disabled={!selected}
            helperText={
              selected && sections.length === 0
                ? `No hay secciones de ${selected.gradeLevel}.º año en el ciclo activo.`
                : ' '
            }
          >
            {sections.map((section) => (
              <MenuItem key={section.id} value={section.id}>
                {sectionLabel(section)}
              </MenuItem>
            ))}
          </TextField>
          {options.error && (
            <Alert severity="error">No se pudieron cargar las opciones. {options.error}</Alert>
          )}
          {editUnavailable && (
            <Alert severity="warning">
              La materia ya no está pendiente: no se puede cambiar la sección.
            </Alert>
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
          disableElevation
          disabled={!canSave}
          onClick={() => void handleSave()}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? 'Guardando...' : editing ? 'Guardar' : 'Asignar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SubjectRepeatDialog
