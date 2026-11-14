import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Alert,
  Stack,
  CircularProgress,
  Divider,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { getStudentById } from '@/services/studentProfile.service'
import {
  createPate,
  getPateOptions,
  type IntensificationModel,
  type PateOptionsResponse,
} from '@/services/pate.service'
import { listEdteMeetings, type EdteMeetingSummary } from '@/services/edteMeeting.service'
import { ApiError } from '@/services/api'
import { PateHeaderSummary } from '@/components/pate/PateHeaderSummary'
import { PateIntensifySection } from '@/components/pate/PateIntensifySection'
import { PateRepeatSection } from '@/components/pate/PateRepeatSection'
import {
  validatePateClientState,
  type PateFormState,
  type SelectedIntensifyItem,
  type SelectedRepeatItem,
} from '@/components/pate/pateFormValidation'

export const PateFormPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const studentId = searchParams.get('studentId') || ''
  const initialMeetingId = searchParams.get('edteMeetingId') || ''

  // Datos del backend
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitErrors, setSubmitErrors] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [student, setStudent] = useState<{
    firstName: string
    lastName: string
    dni: string
  } | null>(null)

  const [pateOptions, setPateOptions] = useState<PateOptionsResponse | null>(null)
  const [edteMeetings, setEdteMeetings] = useState<EdteMeetingSummary[]>([])

  // Estado del formulario
  const [edteMeetingId, setEdteMeetingId] = useState(initialMeetingId)
  const [diagnosis, setDiagnosis] = useState('')
  const [supportStrategies, setSupportStrategies] = useState('')
  const [schedule, setSchedule] = useState('')
  const [intensifyMap, setIntensifyMap] = useState<Map<string, SelectedIntensifyItem>>(new Map())
  const [repeatMap, setRepeatMap] = useState<Map<string, SelectedRepeatItem>>(new Map())

  // Carga inicial
  useEffect(() => {
    if (!studentId) {
      setLoadError('No se especificó el ID del estudiante para crear el PATE.')
      setLoading(false)
      return
    }

    let isMounted = true

    async function loadData() {
      try {
        setLoading(true)
        setLoadError(null)

        const [studentData, optionsData, meetingsData] = await Promise.all([
          getStudentById(studentId),
          getPateOptions(studentId, initialMeetingId || undefined),
          listEdteMeetings({}),
        ])

        if (!isMounted) return

        setStudent({
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          dni: studentData.dni,
        })
        setPateOptions(optionsData)
        setEdteMeetings(meetingsData)

        if (initialMeetingId) {
          setEdteMeetingId(initialMeetingId)
        }
      } catch (err) {
        if (!isMounted) return
        const msg = err instanceof Error ? err.message : 'Error al cargar opciones del PATE'
        setLoadError(msg)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [studentId, initialMeetingId])

  // Manejadores para intensificación
  const handleToggleIntensify = (subjectId: string) => {
    setIntensifyMap((prev) => {
      const next = new Map(prev)
      if (next.has(subjectId)) {
        next.delete(subjectId)
      } else {
        const defaultModel = (pateOptions?.allowedModels[0] as IntensificationModel) || 'MODEL_1'
        next.set(subjectId, {
          pendingSubjectId: subjectId,
          model: defaultModel,
          targetClassSectionId: '',
        })
      }
      return next
    })
    setSubmitErrors([])
  }

  const handleChangeIntensifyModel = (subjectId: string, model: IntensificationModel) => {
    setIntensifyMap((prev) => {
      const next = new Map(prev)
      const current = next.get(subjectId)
      if (current) {
        next.set(subjectId, {
          ...current,
          model,
          targetClassSectionId:
            model === 'MODEL_1' || model === 'MODEL_4' ? '' : current.targetClassSectionId,
        })
      }
      return next
    })
    setSubmitErrors([])
  }

  const handleChangeIntensifySection = (subjectId: string, sectionId: string) => {
    setIntensifyMap((prev) => {
      const next = new Map(prev)
      const current = next.get(subjectId)
      if (current) {
        next.set(subjectId, { ...current, targetClassSectionId: sectionId })
      }
      return next
    })
    setSubmitErrors([])
  }

  // Manejadores para recursado
  const handleToggleRepeat = (subjectId: string) => {
    setRepeatMap((prev) => {
      const next = new Map(prev)
      if (next.has(subjectId)) {
        next.delete(subjectId)
      } else {
        next.set(subjectId, {
          pendingSubjectId: subjectId,
          classSectionId: '',
        })
      }
      return next
    })
    setSubmitErrors([])
  }

  const handleChangeRepeatSection = (subjectId: string, sectionId: string) => {
    setRepeatMap((prev) => {
      const next = new Map(prev)
      const current = next.get(subjectId)
      if (current) {
        next.set(subjectId, { ...current, classSectionId: sectionId })
      }
      return next
    })
    setSubmitErrors([])
  }

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pateOptions) return

    const currentState: PateFormState = {
      edteMeetingId,
      diagnosis,
      supportStrategies,
      schedule,
      intensifyMap,
      repeatMap,
    }

    // Validación cliente previa
    const validation = validatePateClientState(currentState, {
      currentSubjectsCount: pateOptions.currentSubjectsCount,
      maxSubjectsPerCycle: pateOptions.maxSubjectsPerCycle,
      pendingSubjects: pateOptions.pendingSubjects,
      sections: pateOptions.sections,
    })

    if (!validation.valid) {
      setSubmitErrors(validation.errors)
      return
    }

    try {
      setSubmitting(true)
      setSubmitErrors([])

      const payload = {
        studentId,
        edteMeetingId,
        diagnosis: diagnosis.trim(),
        supportStrategies: supportStrategies.trim(),
        schedule: schedule.trim() || null,
        subjectsToIntensify: Array.from(intensifyMap.values()).map((item) => ({
          pendingSubjectId: item.pendingSubjectId,
          model: item.model,
          targetClassSectionId: item.targetClassSectionId || null,
        })),
        subjectsToRepeat: Array.from(repeatMap.values()).map((item) => ({
          pendingSubjectId: item.pendingSubjectId,
          classSectionId: item.classSectionId,
        })),
      }

      await createPate(payload)
      setSuccessMessage('PATE creado exitosamente en estado borrador.')
      setTimeout(() => {
        navigate(`/students/${studentId}`)
      }, 1500)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const details = err.details as { errors?: string[] } | undefined
        if (details?.errors && Array.isArray(details.errors)) {
          setSubmitErrors(details.errors)
        } else {
          setSubmitErrors([err.message || 'Error al guardar el PATE'])
        }
      } else {
        setSubmitErrors([err instanceof Error ? err.message : 'Error inesperado al crear el PATE'])
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Crear PATE"
          subtitle="Plan de Acompañamiento a las Trayectorias Escolares (E4-RF-06)"
          breadcrumbs={[
            { label: 'Inicio', href: '/home' },
            { label: 'Derivados EDTE', href: '/edte-referrals' },
            { label: 'Nuevo PATE' },
          ]}
          action={
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
              Volver
            </Button>
          }
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : loadError ? (
          <Alert severity="error">{loadError}</Alert>
        ) : pateOptions && student ? (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <ContentCard>
              {successMessage && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {successMessage}
                </Alert>
              )}

              {submitErrors.length > 0 && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Por favor revisá los siguientes errores antes de guardar:
                  </Typography>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
                    {submitErrors.map((msg, idx) => (
                      <li key={idx}>
                        <Typography variant="body2">{msg}</Typography>
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}

              {/* Cabecera con datos del alumno y lista de MPAA */}
              <PateHeaderSummary
                student={student}
                year={pateOptions.year}
                pendingSubjects={pateOptions.pendingSubjects}
                currentSubjectsCount={pateOptions.currentSubjectsCount}
                maxSubjectsPerCycle={pateOptions.maxSubjectsPerCycle}
              />

              <Divider sx={{ my: 3 }} />

              {/* Selección de Reunión EDTE */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                  Reunión del EDTE de Origen
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  El PATE debe vincularse obligatoriamente a la reunión del EDTE donde se trató al
                  estudiante.
                </Typography>
                <FormControl
                  fullWidth
                  size="small"
                  required
                  error={!edteMeetingId && submitErrors.length > 0}
                >
                  <InputLabel id="meeting-select-label">Reunión del EDTE</InputLabel>
                  <Select
                    labelId="meeting-select-label"
                    value={edteMeetingId}
                    label="Reunión del EDTE"
                    onChange={(e) => {
                      setEdteMeetingId(e.target.value)
                      setSubmitErrors([])
                    }}
                  >
                    <MenuItem value="">
                      <em>Seleccionar reunión...</em>
                    </MenuItem>
                    {edteMeetings.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.date} — Período: {m.period} (Ciclo {m.year})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* 1. Materias a Intensificar */}
              <PateIntensifySection
                pendingSubjects={pateOptions.pendingSubjects}
                sections={pateOptions.sections}
                allowedModels={pateOptions.allowedModels}
                selectedMap={intensifyMap}
                repeatSubjectIds={new Set(repeatMap.keys())}
                onToggleSubject={handleToggleIntensify}
                onChangeModel={handleChangeIntensifyModel}
                onChangeSection={handleChangeIntensifySection}
              />

              <Divider sx={{ my: 3 }} />

              {/* 2. Materias a Recursar */}
              <PateRepeatSection
                pendingSubjects={pateOptions.pendingSubjects}
                sections={pateOptions.sections}
                selectedMap={repeatMap}
                intensifySubjectIds={new Set(intensifyMap.keys())}
                onToggleSubject={handleToggleRepeat}
                onChangeSection={handleChangeRepeatSection}
              />

              <Divider sx={{ my: 3 }} />

              {/* 3. Fundamentación y Estrategias Pedagógicas */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" component="div" sx={{ mb: 2 }}>
                  3. Diagnóstico y Estrategias Pedagógicas
                </Typography>
                <Stack spacing={3}>
                  <TextField
                    label="Diagnóstico de Situación"
                    multiline
                    rows={4}
                    required
                    fullWidth
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    helperText="Describí los motivos pedagógicos, trayectorias e indicadores que fundamentan el plan."
                  />

                  <TextField
                    label="Estrategias de Acompañamiento"
                    multiline
                    rows={4}
                    required
                    fullWidth
                    value={supportStrategies}
                    onChange={(e) => setSupportStrategies(e.target.value)}
                    helperText="Detallá los dispositivos pedagógicos, acuerdos y apoyos específicos a implementar."
                  />

                  <TextField
                    label="Cronograma de Actividades (Opcional)"
                    multiline
                    rows={3}
                    fullWidth
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    helperText="Indicá fechas clave, hitos de seguimiento o instancias de evaluación previstas."
                  />
                </Stack>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
                <Button variant="outlined" onClick={() => navigate(-1)} disabled={submitting}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={
                    submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />
                  }
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : 'Crear PATE'}
                </Button>
              </Box>
            </ContentCard>
          </Box>
        ) : null}
      </PageContainer>
    </MainLayout>
  )
}
