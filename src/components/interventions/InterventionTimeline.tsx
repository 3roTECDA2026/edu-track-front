import { Box, ButtonBase, Paper, Stack, Typography } from '@mui/material'
import AttachFileIcon from '@mui/icons-material/AttachFile'

import { EVENT_TYPE_CONFIG, summarize } from '@/components/interventions/interventionTimelineConfig'
import { SoftBadge } from '@/components/studentProfile/SoftBadge'
import { formatDate } from '@/components/studentProfile/profileLabels'
import { COLORS, cardSx } from '@/components/studentProfile/profileStyles'
import type { InterventionListItem } from '@/services/interventions.service'

interface InterventionTimelineProps {
  items: InterventionListItem[] // ya ordenadas: la más reciente primero
  onSelect: (item: InterventionListItem) => void
}

const DOT_SIZE = 32

// Línea de tiempo de intervenciones (CRM-088, criterios 1 y 2). Cada ítem muestra fecha, tipo,
// autor, un resumen de la situación y la cantidad de adjuntos; al hacer clic se abre el detalle.
export const InterventionTimeline = ({ items, onSelect }: InterventionTimelineProps) => (
  <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0 }}>
    {items.map((item, index) => {
      const type = EVENT_TYPE_CONFIG[item.eventType]
      const attachments = item._count?.attachments ?? 0
      const isLast = index === items.length - 1
      return (
        <Box
          component="li"
          key={item.id}
          sx={{ display: 'grid', gridTemplateColumns: `${DOT_SIZE}px 1fr`, columnGap: 2 }}
        >
          {/* Marca del tipo y la línea que une con la intervención siguiente */}
          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {!isLast && (
              <Box
                sx={{
                  position: 'absolute',
                  top: DOT_SIZE,
                  bottom: 0,
                  width: 2,
                  bgcolor: 'divider',
                }}
              />
            )}
            <Box
              aria-hidden
              sx={{
                width: DOT_SIZE,
                height: DOT_SIZE,
                mt: 1.5,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                color: type.color,
                bgcolor: type.background,
                border: 1,
                borderColor: COLORS.ink,
                zIndex: 1,
              }}
            >
              <type.Icon fontSize="small" />
            </Box>
          </Box>

          <Paper variant="outlined" sx={{ ...cardSx, mb: 2, p: 0, overflow: 'hidden' }}>
            <ButtonBase
              onClick={() => onSelect(item)}
              aria-label={`Ver detalle de la intervención del ${formatDate(item.date)}`}
              sx={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                p: 2,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>
                  {formatDate(item.date)}
                </Typography>
                <SoftBadge label={type.label} color={type.color} background={type.background} />
                <Box sx={{ flexGrow: 1 }} />
                {attachments > 0 && (
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ alignItems: 'center', color: 'text.secondary' }}
                  >
                    <AttachFileIcon fontSize="small" />
                    <Typography variant="body2">
                      {attachments === 1 ? '1 adjunto' : `${attachments} adjuntos`}
                    </Typography>
                  </Stack>
                )}
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Registró: {item.author.lastName}, {item.author.firstName}
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.ink, mt: 1 }}>
                {summarize(item.description)}
              </Typography>
            </ButtonBase>
          </Paper>
        </Box>
      )
    })}
  </Box>
)

export default InterventionTimeline
