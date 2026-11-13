import { useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { MainLayout } from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { AddButton } from '@/components/common/AddButton'
import { useClassSections } from '@/hooks/useClassSections'
import { useStudents } from '@/hooks/useStudents'
import { useDebounce } from '@/hooks/useDebounce'
import { useCreateIntervention } from '@/hooks/useCreateIntervention'
import { getStudentById } from '@/services/studentProfile.service'
import type { StudentListItem } from '@/services/students.service'
import type { InterventionEventType } from '@/services/interventions.service'

// Opciones del selector de tipo (texto en castellano, valor = enum del back).
const EVENT_TYPE_OPTIONS: { value: InterventionEventType; label: string }[] = [
  { value: 'PEDAGOGICAL', label: 'Pedagógico' },
  { value: 'CONDUCT', label: 'Conductual' },
  { value: 'HEALTH', label: 'Salud' },
]

// Fecha de hoy en AAAA-MM-DD (para el input date).
function todayIso() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

const InterventionFormPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefStudentId = searchParams.get('studentId')
  const prefClassSectionId = searchParams.get('classSectionId')
  const studentLocked = Boolean(prefStudentId)
  const courseLocked = Boolean(prefClassSectionId)

  const { save, saving } = useCreateIntervention()
  const { sections } = useClassSections()

  const [student, setStudent] = useState<StudentListItem | null>(null)
  const [classSectionId, setClassSectionId] = useState('')
  const [eventType, setEventType] = useState<InterventionEventType | ''>('')
  const [description, setDescription] = useState('')
  const [interventionProposal, setInterventionProposal] = useState('')
  const [involvedActors, setInvolvedActors] = useState('')
  const [date, setDate] = useState(todayIso())

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Buscador de alumno con debounce.
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 400)
  const { data: studentsData, loading: loadingStudents } = useStudents({
    page: 1,
    limit: 20,
    search: debounced,
    grade: '',
    division: '',
    shift: '',
    status: 'active',
  })
  const studentOptions = studentsData?.data ?? []

  // Precarga desde la ficha: trae el alumno y preselecciona el curso del query.
  useEffect(() => {
    if (prefClassSectionId) setClassSectionId(prefClassSectionId)
    if (!prefStudentId) return
    getStudentById(prefStudentId)
      .then((s) =>
        setStudent({
          id: s.id,
          dni: s.dni,
          firstName: s.firstName,
          lastName: s.lastName,
          recordNumber: s.recordNumber,
          status: s.status,
          currentSection: s.currentSection,
        })
      )
      .catch(() => setNotice({ type: 'error', text: 'No se pudo cargar el alumno de la ficha.' }))
  }, [prefStudentId, prefClassSectionId])

  // Si el alumno vino de la ficha, autoselecciona su curso actual.
  useEffect(() => {
    if (classSectionId || !student?.currentSection || sections.length === 0) return
    const cs = student.currentSection
    const match = sections.find(
      (s) =>
        s.year === cs.year &&
        s.grade === cs.grade &&
        s.division === cs.division &&
        s.shift === cs.shift
    )
    if (match) setClassSectionId(match.id)
  }, [student, sections, classSectionId])

  const studentLabel = (s: StudentListItem) => `${s.lastName}, ${s.firstName} (DNI ${s.dni})`

  function validate() {
    const next: Record<string, string> = {}
    if (!student) next.student = 'Elegí un alumno'
    if (!classSectionId) next.classSection = 'Elegí un curso'
    if (!eventType) next.eventType = 'Elegí el tipo de evento'
    if (!description.trim()) next.description = 'Describí la situación detectada'
    if (!date) next.date = 'Elegí la fecha'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      setNotice({ type: 'error', text: 'Revisá los campos obligatorios.' })
      return
    }
    try {
      await save({
        studentId: student!.id,
        classSectionId,
        eventType: eventType as InterventionEventType,
        description: description.trim(),
        interventionProposal: interventionProposal.trim() || undefined,
        involvedActors: involvedActors.trim() || undefined,
        date,
      })
      setNotice({ type: 'success', text: 'Intervención registrada correctamente.' })
      // Confirmación y vuelta a la ficha del alumno.
      window.setTimeout(() => navigate(`/students/${student!.id}`), 1200)
    } catch (err: unknown) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo registrar la intervención.',
      })
    }
  }

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Registrar intervención"
          subtitle="Registrá una situación del alumno (pedagógica, conductual o de salud) y la propuesta de intervención."
          breadcrumbs={[
            { label: 'Inicio', href: '/home' },
            { label: 'Estudiantes', href: '/students' },
            { label: 'Registrar intervención' },
          ]}
        />

        <ContentCard>
          <Box sx={{ p: 3 }}>
            {notice && (
              <Alert severity={notice.type} onClose={() => setNotice(null)} sx={{ mb: 3 }}>
                {notice.text}
              </Alert>
            )}

            <Stack spacing={2.5}>
              <Autocomplete
                options={studentOptions}
                value={student}
                loading={loadingStudents}
                disabled={studentLocked}
                onChange={(_, value) => setStudent(value)}
                onInputChange={(_, value) => setSearch(value)}
                getOptionLabel={(option) => studentLabel(option)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Estudiante"
                    required
                    error={Boolean(errors.student)}
                    helperText={errors.student ?? (studentLocked ? 'Cargado desde la ficha' : ' ')}
                  />
                )}
              />

              <FormControl error={Boolean(errors.classSection)} disabled={courseLocked}>
                <InputLabel id="lbl-course">Curso</InputLabel>
                <Select
                  labelId="lbl-course"
                  label="Curso"
                  value={classSectionId}
                  onChange={(event) => setClassSectionId(event.target.value)}
                >
                  {sections.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.grade}° {s.division} ({s.year})
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{errors.classSection ?? ' '}</FormHelperText>
              </FormControl>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  type="date"
                  label="Fecha"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  error={Boolean(errors.date)}
                  helperText={errors.date ?? ' '}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ flex: 1 }}
                />
                <FormControl error={Boolean(errors.eventType)} sx={{ flex: 1 }}>
                  <InputLabel id="lbl-type">Tipo de evento</InputLabel>
                  <Select
                    labelId="lbl-type"
                    label="Tipo de evento"
                    value={eventType}
                    onChange={(event) => setEventType(event.target.value as InterventionEventType)}
                  >
                    {EVENT_TYPE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.eventType ?? ' '}</FormHelperText>
                </FormControl>
              </Stack>

              <TextField
                label="Actores involucrados"
                placeholder="Ej.: EOE, Equipo Directivo, Madre"
                value={involvedActors}
                onChange={(event) => setInvolvedActors(event.target.value)}
              />

              <TextField
                label="Situación detectada"
                required
                multiline
                minRows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                error={Boolean(errors.description)}
                helperText={errors.description ?? ' '}
              />

              <TextField
                label="Propuesta de intervención"
                multiline
                minRows={3}
                value={interventionProposal}
                onChange={(event) => setInterventionProposal(event.target.value)}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <AddButton
                  label={saving ? 'Guardando…' : 'Guardar'}
                  icon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                />
              </Box>
            </Stack>
          </Box>
        </ContentCard>
      </PageContainer>
    </MainLayout>
  )
}

export default InterventionFormPage
