import { Box, Paper, Typography } from '@mui/material'
import EventNoteIcon from '@mui/icons-material/EventNote'

import { InterventionAttachments } from '@/components/interventions/InterventionAttachments'
import { SoftBadge } from '@/components/studentProfile/SoftBadge'
import { TabEmpty, TabError, TabLoading } from '@/components/studentProfile/TabStates'
import { COLORS, cardSx, labelSx } from '@/components/studentProfile/profileStyles'
import { formatDate } from '@/components/studentProfile/profileLabels'
import { useLazyResource } from '@/hooks/useLazyResource'
import {
  listStudentInterventions,
  type InterventionEventType,
} from '@/services/interventions.service'

// Etiquetas de los tipos de evento (el back manda el enum en inglés).
const EVENT_TYPE_LABELS: Record<InterventionEventType, string> = {
  PEDAGOGICAL: 'Pedagógico',
  CONDUCT: 'Conductual',
  HEALTH: 'Salud',
}

interface InterventionsTabProps {
  studentId: string
}

// Bloque etiqueta + texto; no se muestra si el campo viene vacío.
const Field = ({ label, value }: { label: string; value: string | null }) => {
  if (!value) return null
  return (
    <Box>
      <Typography sx={{ ...labelSx, mb: 0.25 }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: COLORS.ink, whiteSpace: 'pre-wrap' }}>
        {value}
      </Typography>
    </Box>
  )
}

export const InterventionsTab = ({ studentId }: InterventionsTabProps) => {
  const interventions = useLazyResource(`interventions:${studentId}`, (signal) =>
    listStudentInterventions(studentId, signal)
  )

  if (interventions.loading && !interventions.data) return <TabLoading />
  if (interventions.error)
    return <TabError message={interventions.error} onRetry={interventions.reload} />

  const items = interventions.data ?? []

  if (items.length === 0) {
    return (
      <TabEmpty
        icon={<EventNoteIcon />}
        title="Sin intervenciones"
        text="Todavía no se registraron intervenciones para este estudiante."
      />
    )
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {items.map((item) => (
        <Paper key={item.id} variant="outlined" sx={{ ...cardSx, p: 2.5 }}>
          {/* Encabezado: fecha, tipo y quién la registró */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>
              {formatDate(item.date)}
            </Typography>
            <SoftBadge
              label={EVENT_TYPE_LABELS[item.eventType]}
              color={COLORS.ink}
              background="#f3f4f6"
            />
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Registró: {item.author.lastName}, {item.author.firstName}
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <Field label="Situación detectada" value={item.description} />
            <Field label="Propuesta de intervención" value={item.interventionProposal} />
            <Field label="Actores involucrados" value={item.involvedActors} />
            <InterventionAttachments interventionId={item.id} />
          </Box>
        </Paper>
      ))}
    </Box>
  )
}

export default InterventionsTab
