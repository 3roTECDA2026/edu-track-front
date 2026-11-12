import { useState } from 'react'
import { Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate'
import CheckIcon from '@mui/icons-material/Check'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import SaveIcon from '@mui/icons-material/Save'

import { AddButton } from '@/components/common/AddButton'
import { cardSx } from '@/components/studentProfile/profileStyles'
import { TabEmpty, TabError, TabLoading } from '@/components/studentProfile/TabStates'
import { useLazyResource } from '@/hooks/useLazyResource'
import {
  getStudentPendingSubjects,
  updatePendingKnowledge,
  type PendingSubject,
  type PendingSubjectStatus,
} from '@/services/pendingSubject.service'

const MAX_LENGTH = 2000

// Estado de la MPAA en blanco y negro (CRM-097): se distingue por el texto, el ícono y la forma
// (contorno o relleno), sin depender del color
const STATUS_CONFIG: Record<
  PendingSubjectStatus,
  { label: string; icon: React.ReactElement; variant: 'outlined' | 'filled' }
> = {
  PENDING: { label: 'Pendiente', icon: <HourglassEmptyIcon />, variant: 'outlined' },
  ACCREDITED: { label: 'Acreditada', icon: <CheckIcon />, variant: 'filled' },
}

const StatusChip = ({ status }: { status: PendingSubjectStatus }) => {
  const config = STATUS_CONFIG[status]
  return (
    <Chip
      size="small"
      label={config.label}
      icon={config.icon}
      variant={config.variant}
      sx={{
        borderRadius: '4px',
        fontWeight: 600,
        borderColor: 'primary.main',
        ...(config.variant === 'filled'
          ? { bgcolor: 'primary.main', color: 'primary.contrastText' }
          : { color: 'primary.main' }),
        '& .MuiChip-icon': { color: 'inherit', fontSize: 16 },
      }}
    />
  )
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
        <StatusChip status={item.status} />
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        {item.gradeLevel ?? item.subject.gradeLevel}° año · Quedó pendiente en el ciclo{' '}
        {item.originAcademicYear.year}
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
          <AddButton
            label={saving ? 'Guardando...' : 'Guardar'}
            icon={<SaveIcon />}
            disabled={!hasChanges || saving}
            onClick={() => void handleSave()}
          />
        </Box>
      )}
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
