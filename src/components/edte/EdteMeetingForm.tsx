import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'

import { ContentCard } from '@/components/common/ContentCard'
import { AddButton } from '@/components/common/AddButton'
import { useNotify } from '@/components/layout/NotificationProvider'
import { SHIFT_LABELS } from '@/components/students/studentLabels'
import {
  MEETING_PERIOD_HINTS,
  MEETING_PERIOD_LABELS,
  memberRoleLabel,
} from '@/components/edte/edteLabels'
import {
  edteMeetingFormSchema,
  meetingDateHint,
  type EdteMeetingFormValues,
} from '@/components/edte/edteMeetingSchema'
import {
  sectionLabel,
  studentLabel,
  useMeetingParticipants,
  type StudentOption,
} from '@/components/edte/useMeetingParticipants'
import { useLazyResource } from '@/hooks/useLazyResource'
import {
  createEdteMeeting,
  getEdteMeetingCandidates,
  getEdteMeetingMemberOptions,
  updateEdteMeeting,
  type EdteMeetingDetail,
  type EdteMeetingPeriod,
} from '@/services/edteMeeting.service'
import type { Shift } from '@/services/students.service'

const emptyValues = (year: number): EdteMeetingFormValues => ({
  year,
  date: '',
  period: 'FEBRUARY_MARCH',
  shift: '',
  considerations: '',
  minutesUrl: '',
})

const valuesFromMeeting = (meeting: EdteMeetingDetail): EdteMeetingFormValues => ({
  year: meeting.year,
  date: meeting.date,
  period: meeting.period,
  shift: meeting.shift ?? '',
  considerations: meeting.considerations ?? '',
  minutesUrl: meeting.minutesUrl ?? '',
})

interface EdteMeetingFormProps {
  // La reunión que se edita, ya cargada; sin ella, es una reunión nueva
  meeting?: EdteMeetingDetail
}

// Formulario de alta y edición de una reunión del EDTE (CRM-075): fecha, período, turno,
// integrantes convocados (presentes o ausentes), alumnos tratados y consideraciones.
// Se monta recién cuando los datos de la reunión ya están cargados, así que su estado inicial sale
// de las props y no hace falta sincronizarlo con efectos.
export const EdteMeetingForm = ({ meeting }: EdteMeetingFormProps) => {
  const isEdit = Boolean(meeting)
  const navigate = useNavigate()
  const notify = useNotify()
  const thisYear = new Date().getFullYear()
  // El ciclo de la reunión que se edita siempre figura entre las opciones
  const yearOptions = [
    ...new Set([thisYear - 1, thisYear, thisYear + 1, meeting?.year ?? thisYear]),
  ].sort()

  const memberOptions = useLazyResource('edte-member-options', (signal) =>
    getEdteMeetingMemberOptions(signal)
  )
  const participants = useMeetingParticipants(meeting)
  const [saving, setSaving] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EdteMeetingFormValues>({
    resolver: zodResolver(edteMeetingFormSchema),
    defaultValues: meeting ? valuesFromMeeting(meeting) : emptyValues(thisYear),
  })
  const year = useWatch({ control, name: 'year' })
  const period = useWatch({ control, name: 'period' })

  // Alumnos para tratar: dependen del ciclo y del período
  const candidates = useLazyResource(
    year && period ? `edte-candidates:${year}:${period}` : null,
    (signal) => getEdteMeetingCandidates(year, period as EdteMeetingPeriod, signal)
  )
  const studentOptions = useMemo(() => {
    const fromCandidates: StudentOption[] = (candidates.data ?? []).map((candidate) => ({
      studentId: candidate.studentId,
      label: studentLabel(candidate),
      detail: `${sectionLabel(candidate.section)} · ${candidate.pendingSubjectsCount} MPAA${
        candidate.pate ? ' · PATE en curso' : ''
      }`,
    }))
    // Los ya elegidos se siguen ofreciendo aunque no estén entre los candidatos
    const extra = participants.students.filter(
      (student) => !fromCandidates.some((option) => option.studentId === student.studentId)
    )
    return [...fromCandidates, ...extra]
  }, [candidates.data, participants.students])

  // Integrantes: el personal que se puede convocar, más los ya convocados que no estén en la lista
  const memberRows = useMemo(() => {
    const options = memberOptions.data ?? []
    const extra = (meeting?.members ?? [])
      .filter((member) => !options.some((option) => option.userId === member.userId))
      .map((member) => ({ userId: member.userId, name: member.name, role: member.role }))
    return [...options, ...extra]
  }, [memberOptions.data, meeting])

  const onSubmit = async (values: EdteMeetingFormValues) => {
    setSaving(true)
    const payload = {
      date: values.date,
      period: values.period,
      shift: (values.shift || null) as Shift | null,
      considerations: values.considerations.trim() || null,
      minutesUrl: values.minutesUrl.trim() || null,
      ...participants.toPayload(),
    }
    try {
      const saved = meeting
        ? await updateEdteMeeting(meeting.id, payload)
        : await createEdteMeeting({ ...payload, year: values.year })
      notify.success(isEdit ? 'Reunión actualizada.' : 'Reunión registrada en borrador.')
      navigate(`/edte-meetings/${saved.id}`)
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'No se pudo guardar la reunión.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        {/* Datos de la reunión */}
        <ContentCard sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Datos de la reunión
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
            }}
          >
            <Controller
              name="year"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  size="small"
                  label="Ciclo lectivo"
                  value={field.value}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                  disabled={isEdit}
                  helperText={isEdit ? 'No se puede cambiar' : 'El de las decisiones de la reunión'}
                >
                  {yearOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  size="small"
                  label="Fecha"
                  error={Boolean(errors.date)}
                  helperText={errors.date?.message ?? meetingDateHint(period, year)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
            <Controller
              name="period"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  size="small"
                  label="Período"
                  error={Boolean(errors.period)}
                  helperText={errors.period?.message ?? MEETING_PERIOD_HINTS[field.value]}
                >
                  {(Object.keys(MEETING_PERIOD_LABELS) as EdteMeetingPeriod[]).map((key) => (
                    <MenuItem key={key} value={key}>
                      {MEETING_PERIOD_LABELS[key]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="shift"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  size="small"
                  label="Turno"
                  helperText="Hay un EDTE por turno"
                >
                  <MenuItem value="">Sin especificar</MenuItem>
                  {(Object.keys(SHIFT_LABELS) as Shift[]).map((key) => (
                    <MenuItem key={key} value={key}>
                      {SHIFT_LABELS[key]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Box>
        </ContentCard>

        {/* Integrantes convocados */}
        <ContentCard>
          <Box sx={{ px: 3, pt: 3, pb: 1.5 }}>
            <Typography variant="h6">Integrantes</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Marcá a quiénes se convocó y, de ellos, quiénes estuvieron presentes.
            </Typography>
          </Box>
          {memberOptions.loading && !memberOptions.data ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : memberOptions.error ? (
            <Alert severity="error" sx={{ mx: 3, mb: 3 }}>
              No se pudo cargar el personal. {memberOptions.error}
            </Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: '#fafafa' }}>Integrante</TableCell>
                    <TableCell sx={{ backgroundColor: '#fafafa' }}>Rol</TableCell>
                    <TableCell align="center" sx={{ backgroundColor: '#fafafa' }}>
                      Convocado
                    </TableCell>
                    <TableCell align="center" sx={{ backgroundColor: '#fafafa' }}>
                      Presente
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {memberRows.map((member) => {
                    const convened = participants.members.has(member.userId)
                    return (
                      <TableRow key={member.userId} hover>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {member.name}
                        </TableCell>
                        <TableCell>{memberRoleLabel(member.role)}</TableCell>
                        <TableCell align="center">
                          <Checkbox
                            size="small"
                            checked={convened}
                            onChange={() => participants.toggleConvened(member.userId)}
                            slotProps={{ input: { 'aria-label': `Convocar a ${member.name}` } }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            size="small"
                            checked={convened && Boolean(participants.members.get(member.userId))}
                            disabled={!convened}
                            onChange={() => participants.togglePresent(member.userId)}
                            slotProps={{
                              input: { 'aria-label': `${member.name} estuvo presente` },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </ContentCard>

        {/* Alumnos tratados */}
        <ContentCard sx={{ p: 3 }}>
          <Typography variant="h6">Alumnos tratados</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {period === 'FEBRUARY_MARCH'
              ? 'Se ofrecen los estudiantes derivados al EDTE al cierre del ciclo anterior.'
              : period === 'ADDITIONAL'
                ? 'Se ofrecen los derivados al EDTE y los que tienen PATE en curso.'
                : 'Se ofrecen los estudiantes con PATE en curso.'}
          </Typography>
          {candidates.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              No se pudieron cargar los alumnos. {candidates.error}
            </Alert>
          )}
          <Autocomplete
            multiple
            options={studentOptions}
            value={participants.students}
            loading={candidates.loading}
            onChange={(_, value) => participants.setStudents(value)}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.studentId === value.studentId}
            noOptionsText="No hay estudiantes para este período"
            renderOption={(props, option) => {
              const { key, ...rest } = props
              return (
                <li key={key} {...rest}>
                  <Box>
                    <Typography variant="body2">{option.label}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {option.detail}
                    </Typography>
                  </Box>
                </li>
              )
            }}
            renderInput={(params) => (
              <TextField {...params} size="small" label="Elegí los alumnos" />
            )}
          />
          {participants.students.length > 0 && (
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              {participants.students.map((student) => (
                <TextField
                  key={student.studentId}
                  size="small"
                  label={`Consideraciones sobre ${student.label}`}
                  value={participants.notes[student.studentId] ?? ''}
                  onChange={(event) => participants.setNote(student.studentId, event.target.value)}
                  multiline
                  minRows={1}
                />
              ))}
            </Stack>
          )}
        </ContentCard>

        {/* Consideraciones generales y acta */}
        <ContentCard sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Consideraciones y acta
          </Typography>
          <Stack spacing={2}>
            <Controller
              name="considerations"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Consideraciones"
                  multiline
                  minRows={4}
                  error={Boolean(errors.considerations)}
                  helperText={
                    errors.considerations?.message ??
                    'Acuerdos y consideraciones pedagógicas de la reunión.'
                  }
                />
              )}
            />
            <Controller
              name="minutesUrl"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  label="Enlace al acta (opcional)"
                  placeholder="https://"
                  error={Boolean(errors.minutesUrl)}
                  helperText={
                    errors.minutesUrl?.message ?? 'Hace falta para marcar la reunión como firmada.'
                  }
                />
              )}
            />
          </Stack>
        </ContentCard>

        {/* Un borrador puede estar incompleto: se avisa, pero no se bloquea el guardado */}
        {(participants.convenedCount === 0 || participants.students.length === 0) && (
          <Alert severity="info">
            {participants.convenedCount === 0 && 'Todavía no hay integrantes convocados. '}
            {participants.students.length === 0 && 'Todavía no hay alumnos tratados. '}
            Podés guardarlo como borrador y completarlo después, pero conviene completarlo antes de
            firmar el acta.
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            color="inherit"
            disabled={saving}
            onClick={() => navigate(meeting ? `/edte-meetings/${meeting.id}` : '/edte-meetings')}
          >
            Cancelar
          </Button>
          <AddButton
            type="submit"
            label={saving ? 'Guardando...' : 'Guardar'}
            icon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={saving}
          />
        </Box>
      </Stack>
    </Box>
  )
}

export default EdteMeetingForm
