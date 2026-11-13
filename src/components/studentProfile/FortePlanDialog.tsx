import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'

import { useLazyResource } from '@/hooks/useLazyResource'
import {
  createFortePlan,
  getForteResponsibles,
  updateFortePlan,
  type FortePlan,
} from '@/services/fortePlan.service'

interface FortePlanDialogProps {
  open: boolean
  // 'assign': asignar (o volver a asignar) al alumno · 'edit': cambiar objetivos o responsable
  mode: 'assign' | 'edit'
  studentId: string
  studentName: string
  plan: FortePlan | null
  onClose: () => void
  onSaved: (message: string) => void
}

// Asignación al Plan Forte y edición del plan (CRM-089)
export const FortePlanDialog = ({
  open,
  mode,
  studentId,
  studentName,
  plan,
  onClose,
  onSaved,
}: FortePlanDialogProps) => {
  // Los posibles responsables se piden recién cuando se abre el diálogo
  const responsibles = useLazyResource(open ? 'forte-responsibles' : null, (signal) =>
    getForteResponsibles(signal)
  )
  const [responsibleId, setResponsibleId] = useState('')
  const [goals, setGoals] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Al abrir, se cargan los datos del plan (si ya tuvo uno, sirven de punto de partida)
  useEffect(() => {
    if (!open) return
    setResponsibleId(plan?.responsible?.id ?? '')
    setGoals(plan?.pedagogicalGoals ?? '')
    setError(null)
  }, [open, plan])

  const options = responsibles.data ?? []
  // Si el responsable anterior ya no está en la lista (por ejemplo, se dio de baja), no cuenta
  const validResponsibleId = options.some((option) => option.id === responsibleId)
    ? responsibleId
    : ''
  const canSave = Boolean(validResponsibleId) && goals.trim() !== '' && !saving

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      if (mode === 'edit' && plan) {
        await updateFortePlan(plan.id, {
          responsibleId: validResponsibleId,
          pedagogicalGoals: goals.trim(),
        })
        onSaved('Plan Forte actualizado.')
      } else {
        await createFortePlan({
          studentId,
          responsibleId: validResponsibleId,
          pedagogicalGoals: goals.trim(),
        })
        onSaved(`${studentName} quedó asignado al Plan Forte.`)
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
        {mode === 'edit'
          ? `Editar Plan Forte · ${studentName}`
          : `Asignar al Plan Forte · ${studentName}`}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Responsable del seguimiento"
            size="small"
            value={validResponsibleId}
            onChange={(event) => setResponsibleId(event.target.value)}
            disabled={responsibles.loading && !responsibles.data}
            helperText={responsibles.loading && !responsibles.data ? 'Cargando docentes...' : ' '}
          >
            {options.length === 0 ? (
              <MenuItem value="" disabled>
                No hay docentes activos
              </MenuItem>
            ) : (
              options.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.name}
                </MenuItem>
              ))
            )}
          </TextField>
          {responsibles.error && (
            <Alert severity="error">No se pudieron cargar los docentes. {responsibles.error}</Alert>
          )}
          <TextField
            label="Objetivos pedagógicos"
            multiline
            minRows={3}
            value={goals}
            onChange={(event) => setGoals(event.target.value.slice(0, 2000))}
            helperText="Los saberes prioritarios que se van a trabajar en el programa."
          />
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
          {saving ? 'Guardando...' : mode === 'edit' ? 'Guardar' : 'Asignar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FortePlanDialog
