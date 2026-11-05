import { useEffect, useState } from 'react'
import {
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

import type { SubjectOption } from '@/services/subjects.service'
import type { ScheduleTeacher } from '@/services/intensificationSchedule.service'

interface ScheduleSubjectDialogProps {
  open: boolean
  // 'add': sumar una materia al período · 'teacher': cambiar solo el docente
  mode: 'add' | 'teacher'
  subjectLabel?: string
  subjects: SubjectOption[]
  teachers: ScheduleTeacher[]
  initialTeacherId: string | null
  saving: boolean
  onClose: () => void
  onSubmit: (data: { subjectId: string; teacherId: string | null }) => void
}

// Modal para sumar una materia a un período, o cambiar su docente responsable
export const ScheduleSubjectDialog = ({
  open,
  mode,
  subjectLabel,
  subjects,
  teachers,
  initialTeacherId,
  saving,
  onClose,
  onSubmit,
}: ScheduleSubjectDialogProps) => {
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')

  useEffect(() => {
    if (open) {
      setSubjectId('')
      setTeacherId(initialTeacherId ?? '')
    }
  }, [open, initialTeacherId])

  const canSave = (mode === 'teacher' || Boolean(subjectId)) && !saving

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {mode === 'add' ? 'Agregar materia' : `Docente responsable · ${subjectLabel ?? ''}`}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {mode === 'add' && (
            <TextField
              select
              label="Materia"
              size="small"
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              helperText={
                subjects.length === 0 ? 'Todas las materias ya están en este período' : ' '
              }
            >
              {subjects.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name} · {subject.gradeLevel}° año
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            select
            label="Docente responsable"
            size="small"
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            helperText="Opcional: se puede definir más adelante"
          >
            <MenuItem value="">Sin asignar</MenuItem>
            {teachers.map((teacher) => (
              <MenuItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </MenuItem>
            ))}
          </TextField>
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
          onClick={() => onSubmit({ subjectId, teacherId: teacherId || null })}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ backgroundColor: '#111827', '&:hover': { backgroundColor: '#1f2937' } }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ScheduleSubjectDialog
