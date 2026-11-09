import { useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import ConflictAttachments from '@/components/conflicts/ConflictAttachments'
import MainLayout from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { useDebounce } from '@/hooks/useDebounce'
import { useStudents } from '@/hooks/useStudents'
import type { StudentListItem } from '@/services/students.service'
import {
  createLegalConflict,
  getConflictCodes,
  getStudentLegalConflicts,
  type ConflictCode,
  type LegalConflict,
} from '@/services/conflicts.service'

const studentLabel = (student: StudentListItem) =>
  `${student.lastName}, ${student.firstName} — DNI ${student.dni}`

function formatDate(value: string | null) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Fecha inválida'
    : date.toLocaleString('es-AR')
}

export default function ConflictsPage() {
  const [student, setStudent] = useState<StudentListItem | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  const { data: studentsData, loading: loadingStudents } = useStudents({
    page: 1,
    limit: 20,
    search: debouncedSearch,
    grade: '',
    division: '',
    shift: '',
    status: 'all',
  })

  const [conflictCode, setConflictCode] = useState('')
  const [conflictCodes, setConflictCodes] = useState<ConflictCode[]>([])
  const [loadingCodes, setLoadingCodes] = useState(true)
  const [codesError, setCodesError] = useState('')
  const [occurrenceDate, setOccurrenceDate] = useState('')
  const [detailedReport, setDetailedReport] = useState('')
  const [conflicts, setConflicts] = useState<LegalConflict[]>([])
  const [loadingConflicts, setLoadingConflicts] = useState(false)
  const [loadingError, setLoadingError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getConflictCodes(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setConflictCodes(data)
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setCodesError(
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar los códigos.'
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCodes(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    setConflicts([])
    setLoadingError('')

    if (!student) {
      setLoadingConflicts(false)
      return
    }

    const controller = new AbortController()
    setLoadingConflicts(true)

    getStudentLegalConflicts(student.id, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setConflicts(data)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLoadingError(
          error instanceof Error
            ? error.message
            : 'No se pudo consultar el historial de conflictos.'
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingConflicts(false)
      })

    return () => controller.abort()
  }, [student, reloadKey])

  const canSubmit =
    Boolean(student) &&
    Boolean(conflictCode.trim()) &&
    Boolean(occurrenceDate) &&
    Boolean(detailedReport.trim()) &&
    !saving

  const handleSave = async () => {
    if (!student || !canSubmit) return

    setSaving(true)
    setSaveError('')
    setSuccess('')

    try {
      await createLegalConflict({
        studentId: student.id,
        conflictCode,
        occurrenceDate: new Date(occurrenceDate).toISOString(),
        detailedReport: detailedReport.trim(),
      })

      setConflictCode('')
      setOccurrenceDate('')
      setDetailedReport('')
      setConfirmOpen(false)
      setSuccess('El conflicto se registró correctamente.')
      setReloadKey((value) => value + 1)
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'No se pudo registrar el conflicto.'
      )
      setConfirmOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Registro de conflictos"
          subtitle="Registro y consulta de situaciones de alta complejidad."
          breadcrumbs={[
            { label: 'Inicio', href: '/home' },
            { label: 'Conflictos' },
          ]}
        />

        <Stack spacing={3}>
          <ContentCard>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Nuevo conflicto
              </Typography>

              <Stack spacing={3}>
                <Autocomplete
                  options={studentsData?.data ?? []}
                  value={student}
                  loading={loadingStudents}
                  filterOptions={(options) => options}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  getOptionLabel={studentLabel}
                  onChange={(_, value) => {
                    setStudent(value)
                    setSaveError('')
                    setSuccess('')
                  }}
                  onInputChange={(_, value, reason) => {
                    if (reason === 'input' || reason === 'clear') {
                      setSearch(value)
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Alumno"
                      placeholder="Buscar por apellido o DNI"
                      required
                    />
                  )}
                  noOptionsText="No se encontraron alumnos"
                />

                <Autocomplete
                  options={conflictCodes}
                  loading={loadingCodes}
                  value={conflictCodes.find((item) => item.code === conflictCode) ?? null}
                  onChange={(_, value) => setConflictCode(value?.code ?? '')}
                  getOptionLabel={(option) => `${option.code} — ${option.description}`}
                  isOptionEqualToValue={(option, value) => option.code === value.code}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Código normalizado"
                      required
                      helperText={
                        codesError ||
                        (conflictCodes.length === 0 && !loadingCodes
                          ? 'No hay códigos disponibles.'
                          : '')
                      }
                    />
                  )}
                />

                <TextField
                  label="Fecha y hora del suceso"
                  type="datetime-local"
                  value={occurrenceDate}
                  onChange={(event) => setOccurrenceDate(event.target.value)}
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                  required
                  fullWidth
                />

                <TextField
                  label="Informe detallado"
                  value={detailedReport}
                  onChange={(event) => setDetailedReport(event.target.value)}
                  placeholder="Describí detalladamente lo ocurrido..."
                  multiline
                  minRows={5}
                  required
                  fullWidth
                />

                <Alert severity="warning">
                  El conflicto queda bloqueado desde el momento de su registro.
                  No podrá editarse ni eliminarse. Los seguimientos posteriores
                  se incorporan mediante anexos permanentes.
                </Alert>

                {saveError && <Alert severity="error">{saveError}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    disabled={!canSubmit}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Guardar conflicto
                  </Button>
                </Box>
              </Stack>
            </Box>
          </ContentCard>

          <ContentCard>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Historial de conflictos del alumno
              </Typography>

              {!student ? (
                <Typography color="text.secondary">
                  Seleccioná un alumno para consultar sus conflictos.
                </Typography>
              ) : loadingConflicts ? (
                <CircularProgress size={24} />
              ) : loadingError ? (
                <Alert severity="error">{loadingError}</Alert>
              ) : conflicts.length === 0 ? (
                <Typography color="text.secondary">
                  No se encontraron conflictos registrados para este alumno.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {conflicts.map((conflict) => (
                    <Box
                      key={conflict.id}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        Código: {conflict.conflictCode}
                      </Typography>
                      <Typography variant="body2">
                        Fecha: {formatDate(
                          conflict.occurrenceDate ?? conflict.registeredAt
                        )}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ overflowWrap: 'anywhere' }}
                      >
                        UUID: {conflict.documentUuid}
                      </Typography>
                      <ConflictAttachments conflictId={conflict.id} />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </ContentCard>
        </Stack>

        <Dialog
          open={confirmOpen}
          onClose={() => {
            if (!saving) setConfirmOpen(false)
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Confirmar registro de conflicto</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Confirmás que los datos ingresados son correctos?
              El conflicto quedará bloqueado desde el momento de su registro.
              Una vez registrado, no podrá editarse ni eliminarse.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setConfirmOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !canSubmit}
            >
              {saving ? 'Guardando...' : 'Confirmar'}
            </Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    </MainLayout>
  )
}
