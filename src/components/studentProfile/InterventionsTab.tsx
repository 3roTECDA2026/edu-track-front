import { useState } from 'react'
import { Alert, Box, Button, Typography } from '@mui/material'
import EventNoteIcon from '@mui/icons-material/EventNote'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'

import { InterventionDetailDialog } from '@/components/interventions/InterventionDetailDialog'
import { InterventionTimeline } from '@/components/interventions/InterventionTimeline'
import { InterventionTimelineFilters } from '@/components/interventions/InterventionTimelineFilters'
import {
  timelinePdfFileName,
  validateDateRange,
} from '@/components/interventions/interventionTimelineConfig'
import { useNotify } from '@/components/layout/NotificationProvider'
import { TabEmpty, TabError, TabLoading } from '@/components/studentProfile/TabStates'
import { useDebounce } from '@/hooks/useDebounce'
import { useLazyResource } from '@/hooks/useLazyResource'
import {
  INTERVENTIONS_PAGE_LIMIT,
  downloadInterventionTimelinePdf,
  listStudentInterventions,
  type InterventionFilters,
  type InterventionListItem,
} from '@/services/interventions.service'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { saveBlob } from '@/utils/saveBlob'

interface InterventionsTabProps {
  studentId: string
  // Para el nombre del PDF exportado ("intervenciones-Perez-2026-11-18.pdf")
  studentLastName?: string
}

// Espera antes de consultar al cambiar un filtro: al escribir una fecha a mano no se pide al
// back con cada número intermedio.
const FILTERS_DEBOUNCE_MS = 400

// Fecha de hoy en AAAA-MM-DD, en hora local.
function todayIso() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

// Pestaña "Intervenciones" de la ficha del alumno (CRM-088, E4-RF-13): línea de tiempo con
// filtros, detalle al hacer clic y exportación a PDF para las entrevistas con las familias.
export const InterventionsTab = ({ studentId, studentLastName }: InterventionsTabProps) => {
  const notify = useNotify()
  const [filters, setFilters] = useState<InterventionFilters>({})
  const [selected, setSelected] = useState<InterventionListItem | null>(null)
  const [exporting, setExporting] = useState(false)

  // El listado y el PDF usan los filtros "asentados": los últimos que no cambiaron en 400 ms
  const appliedFilters = useDebounce(filters, FILTERS_DEBOUNCE_MS)
  const filtersPending = appliedFilters !== filters

  // Con un rango de fechas inválido no se pide nada: se muestra el error en los filtros
  const rangeError = validateDateRange(filters.from, filters.to)
  const appliedRangeError = validateDateRange(appliedFilters.from, appliedFilters.to)
  const resourceKey = appliedRangeError
    ? null
    : `interventions:${studentId}:${appliedFilters.eventType ?? ''}:${appliedFilters.from ?? ''}:${appliedFilters.to ?? ''}`

  const interventions = useLazyResource(resourceKey, (signal) =>
    listStudentInterventions(studentId, appliedFilters, signal)
  )

  const items = interventions.data?.items ?? []
  const total = interventions.data?.total ?? 0
  // Describe lo que se está mostrando, por eso usa los filtros ya aplicados
  const hasFilters = Boolean(appliedFilters.eventType || appliedFilters.from || appliedFilters.to)

  const handleExport = async () => {
    setExporting(true)
    try {
      // Los mismos filtros que el listado que se ve en pantalla
      const pdf = await downloadInterventionTimelinePdf(studentId, appliedFilters)
      saveBlob(pdf, timelinePdfFileName(studentLastName, todayIso()))
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'No se pudo generar el PDF.'))
    } finally {
      setExporting(false)
    }
  }

  const renderContent = () => {
    if (rangeError) return null
    if (interventions.loading && !interventions.data) return <TabLoading />
    if (interventions.error) {
      return <TabError message={interventions.error} onRetry={interventions.reload} />
    }
    if (items.length === 0) {
      return hasFilters ? (
        <TabEmpty
          icon={<EventNoteIcon />}
          title="Sin resultados"
          text="No hay intervenciones con los filtros elegidos."
        />
      ) : (
        <TabEmpty
          icon={<EventNoteIcon />}
          title="Sin intervenciones"
          text="Todavía no se registraron intervenciones para este estudiante."
        />
      )
    }
    return (
      <>
        {total > items.length && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Se muestran las {INTERVENTIONS_PAGE_LIMIT} intervenciones más recientes de {total}. Usá
            los filtros para ver las anteriores.
          </Alert>
        )}
        <InterventionTimeline items={items} onSelect={setSelected} />
      </>
    )
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 2 }}>
        <InterventionTimelineFilters filters={filters} onChange={setFilters} error={rangeError} />
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<PictureAsPdfOutlinedIcon />}
          onClick={handleExport}
          disabled={exporting || filtersPending || Boolean(rangeError) || items.length === 0}
          sx={{ textTransform: 'none' }}
        >
          {exporting ? 'Generando PDF…' : 'Exportar a PDF'}
        </Button>
      </Box>

      {hasFilters && !rangeError && interventions.data && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          El PDF incluye solo las intervenciones que coinciden con los filtros.
        </Typography>
      )}

      {renderContent()}

      <InterventionDetailDialog
        key={selected?.id ?? 'none'}
        intervention={selected}
        onClose={() => setSelected(null)}
        onAttachmentsAdded={interventions.reload}
      />
    </Box>
  )
}

export default InterventionsTab
