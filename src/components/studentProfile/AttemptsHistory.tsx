import { useState } from 'react'
import {
  Box,
  Button,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import HistoryIcon from '@mui/icons-material/History'

import { AttachmentList } from '@/components/common/AttachmentList'
import {
  MODEL_SHORT_LABELS,
  PERIOD_LABELS,
  RESULT_LABELS,
} from '@/components/intensification/intensificationLabels'
import { SoftBadge } from '@/components/studentProfile/SoftBadge'
import { TabEmpty, TabError, TabLoading } from '@/components/studentProfile/TabStates'
import { useLazyResource } from '@/hooks/useLazyResource'
import { ATTACHMENT_DELETE_ROLES, intensificationService } from '@/services/intensification.service'
import {
  getPendingSubjectAttempts,
  type PendingSubjectAttempt,
} from '@/services/pendingSubject.service'
import { getRole } from '@/services/session'

// Resultado en blanco y negro: el estándar del proyecto no usa colores para el estado
const RESULT_BADGE = { color: '#111827', background: '#f3f4f6' }

// Las fechas del período vienen en UTC y sin hora: se muestran en UTC para que no se corran un día
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { timeZone: 'UTC' })

// "ciclo 2025 · 18/2/2026 al 6/3/2026". El ciclo sale del calendario: febrero/marzo de 2026 es del ciclo 2025
function periodDetail(attempt: PendingSubjectAttempt) {
  const parts: string[] = []
  if (attempt.cycleYear !== null) parts.push(`ciclo ${attempt.cycleYear}`)
  if (attempt.startDate && attempt.endDate) {
    parts.push(`${formatDate(attempt.startDate)} al ${formatDate(attempt.endDate)}`)
  }
  return parts.join(' · ')
}

interface AttemptsHistoryProps {
  pendingSubjectId: string
}

// Historial de intentos de intensificación de una MPAA (E3-RF-03, CRM-054).
// Los intentos se piden la primera vez que se abre el bloque.
export const AttemptsHistory = ({ pendingSubjectId }: AttemptsHistoryProps) => {
  const [open, setOpen] = useState(false)
  // Quitar una evidencia: dirección y administración (el back lo valida igual)
  const role = getRole()
  const canDeleteEvidence = role !== undefined && ATTACHMENT_DELETE_ROLES.includes(role)
  const [requested, setRequested] = useState(false)

  const attempts = useLazyResource(
    requested ? `pending-attempts:${pendingSubjectId}` : null,
    (signal) => getPendingSubjectAttempts(pendingSubjectId, signal)
  )

  function handleToggle() {
    setOpen((current) => !current)
    setRequested(true)
  }

  const renderContent = () => {
    if (attempts.loading && !attempts.data) return <TabLoading />
    if (attempts.error) return <TabError message={attempts.error} onRetry={attempts.reload} />
    if (!attempts.data || attempts.data.length === 0) {
      return (
        <TabEmpty
          icon={<HistoryIcon />}
          title="Sin intentos de intensificación"
          text="Todavía no hay intentos de intensificación para esta materia."
        />
      )
    }

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Período</TableCell>
              <TableCell>Modelo</TableCell>
              <TableCell>Resultado</TableCell>
              <TableCell align="right">Nota</TableCell>
              <TableCell>Evidencias</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attempts.data.map((attempt) => (
              <TableRow key={attempt.id}>
                <TableCell>
                  <Typography variant="body2">{PERIOD_LABELS[attempt.period]}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {periodDetail(attempt)}
                  </Typography>
                </TableCell>
                <TableCell>{MODEL_SHORT_LABELS[attempt.model]}</TableCell>
                <TableCell>
                  {attempt.resultCode ? (
                    <Tooltip title={RESULT_LABELS[attempt.resultCode]}>
                      <Box component="span" sx={{ display: 'inline-block' }}>
                        <SoftBadge
                          label={attempt.resultCode}
                          color={RESULT_BADGE.color}
                          background={RESULT_BADGE.background}
                        />
                      </Box>
                    </Tooltip>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Sin resultado
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">{attempt.score ?? '—'}</TableCell>
                <TableCell>
                  {attempt.attachmentsCount > 0 ? (
                    <AttachmentList
                      resourceKey={`intensification-attachments:${attempt.id}`}
                      load={(signal) => intensificationService.listAttachments(attempt.id, signal)}
                      download={(file) =>
                        intensificationService.downloadAttachment(attempt.id, file.id)
                      }
                      openLabel={`Ver evidencias (${attempt.attachmentsCount})`}
                      emptyText="Este intento ya no tiene evidencias."
                      allowPreview
                      onDelete={
                        canDeleteEvidence
                          ? async (file) => {
                              await intensificationService.deleteAttachment(attempt.id, file.id)
                            }
                          : undefined
                      }
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Sin evidencias
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        color="inherit"
        size="small"
        onClick={handleToggle}
        endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      >
        Historial de intentos
      </Button>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ mt: 1 }}>{renderContent()}</Box>
      </Collapse>
    </Box>
  )
}

export default AttemptsHistory
