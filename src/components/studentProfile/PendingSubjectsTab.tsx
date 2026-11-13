import { useState } from 'react'
import { Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate'
import SaveIcon from '@mui/icons-material/Save'

import { AttemptsHistory } from '@/components/studentProfile/AttemptsHistory'
import { cardSx } from '@/components/studentProfile/profileStyles'
import { SoftBadge } from '@/components/studentProfile/SoftBadge'
import { TabEmpty, TabError, TabLoading } from '@/components/studentProfile/TabStates'
import { useLazyResource } from '@/hooks/useLazyResource'
import {
  getStudentPendingSubjects,
  updatePendingKnowledge,
  type PendingSubject,
  type PendingSubjectStatus,
} from '@/services/pendingSubject.service'

const MAX_LENGTH = 2000

const STATUS_CONFIG: Record<
  PendingSubjectStatus,
  { label: string; color: string; background: string }
> = {
  PENDING: { label: 'Pendiente', color: '#92400e', background: '#fef3c7' },
  ACCREDITED: { label: 'Acreditada', color: '#15803d', background: '#dcfce7' },
}

interface PendingSubjectCardProps {
  item: PendingSubject
  onSaved: (message: string, severity: 'success' | 'error') => void
  onUpdated: () => void
}

// Una MPAA con sus dos textos: los saberes pendientes al inicio y al cierre del ciclo
const PendingSubjectCard = ({ item, onSaved, onUpdated }: PendingSubjectCardProps) => {
  const savedInitial = item.initialPendingKnowledge ?? ''
  const savedClosing = item.closingPendingKnowledge ?? ''
  const [initial, setInitial] = useState(savedInitial)
  const [closing, setClosing] = useState(savedClosing)
  const [saving, setSaving] = useState(false)

  const status = STATUS_CONFIG[item.status]
  // Una MPAA acreditada ya no tiene saberes por completar
  const readOnly = item.status === 'ACCREDITED'
  const hasChanges = initial !== savedInitial || closing !== savedClosing

  async function handleSave() {
    setSaving(true)
    try {
      // Se mandan solo los campos que cambiaron
      await updatePendingKnowledge(item.id, {
        ...(initial !== savedInitial && { initialPendingKnowledge: initial }),
        ...(closing !== savedClosing && { closingPendingKnowledge: closing }),
      })
      onSaved(`Saberes de ${item.subject.name} guardados.`, 'success')
      onUpdated()
    } catch (err: unknown) {
      onSaved(err instanceof Error ? err.message : 'No se pudieron guardar los saberes.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ ...cardSx, p: 2.5 }}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'center', mb: 0.5, flexWrap: 'wrap', rowGap: 1 }}
      >
        <Typography variant="h6">{item.subject.name}</Typography>
        <SoftBadge label={status.label} color={status.color} background={status.background} />
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        {item.subject.gradeLevel}° año · Quedó pendiente en el ciclo {item.originAcademicYear.year}
      </Typography>

      <Stack spacing={2}>
        <TextField
          label="Saberes pendientes al inicio del ciclo"
          multiline
          minRows={2}
          value={initial}
          disabled={readOnly || saving}
          onChange={(event) => setInitial(event.target.value.slice(0, MAX_LENGTH))}
          helperText={`${initial.length}/${MAX_LENGTH}`}
        />
        <TextField
          label="Saberes pendientes al cierre del ciclo"
          multiline
          minRows={2}
          value={closing}
          disabled={readOnly || saving}
          onChange={(event) => setClosing(event.target.value.slice(0, MAX_LENGTH))}
          helperText={`${closing.length}/${MAX_LENGTH}`}
        />
      </Stack>

      {!readOnly && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Button
            color="inherit"
            disabled={!hasChanges || saving}
            onClick={() => {
              setInitial(savedInitial)
              setClosing(savedClosing)
            }}
          >
            Descartar
          </Button>
          <Button
            variant="contained"
            disableElevation
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={!hasChanges || saving}
            onClick={() => void handleSave()}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
      )}
      <AttemptsHistory pendingSubjectId={item.id} />
    </Paper>
  )
}

interface PendingSubjectsTabProps {
  studentId: string
  onSaved: (message: string, severity: 'success' | 'error') => void
}

// Materias pendientes del alumno (E3-RF-02, CRM-053): saberes pendientes por cada MPAA
export const PendingSubjectsTab = ({ studentId, onSaved }: PendingSubjectsTabProps) => {
  const pendings = useLazyResource(`pending-subjects:${studentId}`, (signal) =>
    getStudentPendingSubjects(studentId, signal)
  )

  if (pendings.loading && !pendings.data) return <TabLoading />
  if (pendings.error) return <TabError message={pendings.error} onRetry={pendings.reload} />
  if (!pendings.data || pendings.data.length === 0) {
    return (
      <TabEmpty
        icon={<AssignmentLateIcon />}
        title="Sin materias pendientes"
        text="El alumno no tiene materias pendientes de aprobación y acreditación."
      />
    )
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {pendings.data.map((item) => (
        // La key incluye updatedAt: al guardar y recargar, la tarjeta se arma de nuevo con lo guardado
        <PendingSubjectCard
          key={`${item.id}:${item.updatedAt}`}
          item={item}
          onSaved={onSaved}
          onUpdated={pendings.reload}
        />
      ))}
    </Box>
  )
}

export default PendingSubjectsTab
