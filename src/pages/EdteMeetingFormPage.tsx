import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

import MainLayout from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
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
  type EdteMeetingFormValues,
} from '@/components/edte/edteMeetingSchema'
import { useLazyResource } from '@/hooks/useLazyResource'
import {
  createEdteMeeting,
  getEdteMeeting,
  getEdteMeetingCandidates,
  getEdteMeetingMemberOptions,
  updateEdteMeeting,
  type EdteMeetingDetail,
  type EdteMeetingPeriod,
} from '@/services/edteMeeting.service'
import type { Shift } from '@/services/students.service'

// Alumno elegido en el selector, con lo necesario para mostrarlo
interface StudentOption {
  studentId: string
  label: string
  detail: string
}

const studentLabel = (student: { lastName: string; firstName: string; dni: string }) =>
  `${student.lastName}, ${student.firstName} (DNI ${student.dni})`

const sectionLabel = (section: { grade: number; division: string } | null) =>
  section ? `${section.grade}° ${section.division}` : 'Sin curso en el ciclo'

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

// Alta y edición de una reunión del EDTE (CRM-075): fecha, período, turno, integrantes
// convocados (presentes o ausentes), alumnos tratados y consideraciones.
export const EdteMeetingFormPage = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const notify = useNotify()
  const thisYear = new Date().getFullYear()
  const yearOptions = [thisYear - 1, thisYear, thisYear + 1]

  const meeting = useLazyResource(id ? `edte-meeting:${id}` : null, (signal) =>
    getEdteMeeting(id ?? '', signal)
  )
  const memberOptions = useLazyResource('edte-member-options', (signal) =>
    getEdteMeetingMemberOptions(signal)
  )

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EdteMeetingFormValues>({
    resolver: zodResolver(edteMeetingFormSchema),
    defaultValues: emptyValues(thisYear),
  })
  const year = useWatch({ control, name: 'year' })
  const period = useWatch({ control, name: 'period' })

  // Convocados: userId → presente. Si no está en el mapa, no fue convocado
  const [members, setMembers] = useState<Map<string, boolean>>(new Map())
  const [students, setStudents] = useState<StudentOption[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loadedId, setLoadedId] = useState<string | null>(null)

  // En la edición, se cargan los datos de la reunión una sola vez
  const meetingData = meeting.data
  if (meetingData && loadedId !== meetingData.id) {
    setLoadedId(meetingData.id)
    setMembers(new Map(meetingData.members.map((member) => [member.userId, member.present])))
    setStudents(
      meetingData.students.map((student) => ({
        studentId: student.studentId,
        label: studentLabel(student),
        detail: sectionLabel(student.section),
      }))
    )
    setNotes(
      Object.fromEntries(
        meetingData.students.map((student) => [student.studentId, student.notes ?? ''])
      )
    )
  }
  useEffect(() => {
    if (meetingData) reset(valuesFromMeeting(meetingData))
  }, [meetingData, reset])

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
    const extra = students.filter(
      (student) => !fromCandidates.some((option) => option.studentId === student.studentId)
    )
    return [...fromCandidates, ...extra]
  }, [candidates.data, students])

  // Integrantes: el personal que se puede convocar, más los ya convocados que no estén en la lista
  const memberRows = useMemo(() => {
    const options = memberOptions.data ?? []
    const extra = (meetingData?.members ?? [])
      .filter((member) => !options.some((option) => option.userId === member.userId))
      .map((member) => ({ userId: member.userId, name: member.name, role: member.role }))
    return [...options, ...extra]
  }, [memberOptions.data, meetingData])

  const toggleConvened = (userId: string) =>
    setMembers((prev) => {
      const next = new Map(prev)
      if (next.has(userId)) next.delete(userId)
      else next.set(userId, true)
      return next
    })
  const togglePresent = (userId: string) =>
    setMembers((prev) => new Map(prev).set(userId, !prev.get(userId)))

  const onSubmit = async (values: EdteMeetingFormValues) => {
    setSaving(true)
    const payload = {
      date: values.date,
      period: values.period,
      shift: (values.shift || null) as Shift | null,
      considerations: values.considerations.trim() || null,
      minutesUrl: values.minutesUrl.trim() || null,
      members: [...members].map(([userId, present]) => ({ userId, present })),
      students: students.map((student) => ({
        studentId: student.studentId,
        notes: notes[student.studentId]?.trim() || null,
      })),
    }
    try {
      const saved =
        isEdit && id
          ? await updateEdteMeeting(id, payload)
          : await createEdteMeeting({ ...payload, year: values.year })
      notify.success(isEdit ? 'Reunión actualizada.' : 'Reunión registrada en borrador.')
      navigate(`/edte-meetings/${saved.id}`)
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'No se pudo guardar la reunión.')
    } finally {
      setSaving(false)
    }
  }

  const title = isEdit ? 'Editar reunión del EDTE' : 'Nueva reunión del EDTE'
  const header = (
    <PageHeader
      title={title}
      breadcrumbs={[
        { label: 'Inicio', href: '/home' },
        { label: 'Reuniones del EDTE', href: '/edte-meetings' },
        { label: isEdit ? 'Editar' : 'Nueva' },
      ]}
    />
  )

  // Estados de la edición: cargando, error o reunión ya firmada
  if (isEdit && (meeting.loading || meeting.error || meetingData?.status === 'SIGNED')) {
    return (
      <MainLayout>
        <PageContainer>
          {header}
          {meeting.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Alert
              severity={meeting.error ? 'error' : 'info'}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => navigate(`/edte-meetings/${id}`)}
                >
                  Ver la reunión
                </Button>
              }
            >
              {meeting.error
                ? `No se pudo cargar la reunión. ${meeting.error}`
                : 'La reunión ya está firmada: no se puede editar.'}
            </Alert>
          )}
        </PageContainer>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <PageContainer>
        {header}

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
                      helperText={
                        isEdit ? 'No se puede cambiar' : 'El de las decisiones de la reunión'
                      }
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
                      helperText={errors.date?.message ?? ' '}
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
                        const convened = members.has(member.userId)
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
                                onChange={() => toggleConvened(member.userId)}
                                slotProps={{ input: { 'aria-label': `Convocar a ${member.name}` } }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Checkbox
                                size="small"
                                checked={convened && Boolean(members.get(member.userId))}
                                disabled={!convened}
                                onChange={() => togglePresent(member.userId)}
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
                value={students}
                loading={candidates.loading}
                onChange={(_, value) => setStudents(value)}
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
              {students.length > 0 && (
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  {students.map((student) => (
                    <TextField
                      key={student.studentId}
                      size="small"
                      label={`Consideraciones sobre ${student.label}`}
                      value={notes[student.studentId] ?? ''}
                      onChange={(event) =>
                        setNotes((prev) => ({
                          ...prev,
                          [student.studentId]: event.target.value.slice(0, 2000),
                        }))
                      }
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
                        errors.minutesUrl?.message ??
                        'Hace falta para marcar la reunión como firmada.'
                      }
                    />
                  )}
                />
              </Stack>
            </ContentCard>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                color="inherit"
                disabled={saving}
                onClick={() => navigate(isEdit ? `/edte-meetings/${id}` : '/edte-meetings')}
              >
                Cancelar
              </Button>
              <AddButton
                onClick={handleSubmit(onSubmit)}
                label={saving ? 'Guardando...' : 'Guardar'}
                icon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={saving}
              />
            </Box>
          </Stack>
        </Box>
      </PageContainer>
    </MainLayout>
  )
}

export default EdteMeetingFormPage
