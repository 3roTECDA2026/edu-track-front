import { useState } from 'react'
import { Alert, Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'

import {
  INTEGRITY_REASON_LABELS,
  INTEGRITY_STATUS_CONFIG,
  SIGNATURE_STATUS_LABELS,
  shortHash,
} from '@/components/conflicts/integrityLabels'
import {
  verifyLegalConflict,
  type ConflictVerification,
  type IntegrityStatus,
  type LegalConflictDetail,
} from '@/services/conflicts.service'
import { formatDateTime } from '@/utils/dateTime'

const monoSx = { fontFamily: 'monospace', overflowWrap: 'anywhere' } as const

// Identificador y hash de un documento, con botón para copiar el hash completo.
export function DocumentIdentity({ uuid, hash }: { uuid: string; hash: string | null }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!hash) return
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sin permiso para el portapapeles: el hash completo queda en el tooltip
    }
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" component="div" sx={monoSx}>
        UUID: {uuid}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        component="div"
        sx={{ ...monoSx, display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        {hash ? (
          <>
            <Tooltip title={hash}>
              <span>Hash: {shortHash(hash)}</span>
            </Tooltip>
            <Tooltip title={copied ? 'Copiado' : 'Copiar hash completo'}>
              <IconButton size="small" aria-label="Copiar hash" onClick={() => void copy()}>
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          'Hash: sin hash (registro anterior a la verificación de integridad)'
        )}
      </Typography>
    </Box>
  )
}

// Estado de integridad con ícono y texto (nunca solo color)
export function IntegrityBadge({ status }: { status: IntegrityStatus }) {
  const { label, color, Icon } = INTEGRITY_STATUS_CONFIG[status]
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color }}>
      <Icon fontSize="small" />
      <Typography component="span" variant="body2" sx={{ fontWeight: 700, color }}>
        {label}
      </Typography>
    </Box>
  )
}

interface ConflictIntegrityProps {
  conflict: LegalConflictDetail
  // Para nombrar cada anexo en el resultado ("Anexo del 17/11/2026 18:30")
  attachmentLabel: (attachmentId: string) => string
}

// Integridad del acta (CRM-093, E4-RF-17): UUID y hash del acta, y verificación a pedido.
export default function ConflictIntegrity({ conflict, attachmentLabel }: ConflictIntegrityProps) {
  const [result, setResult] = useState<ConflictVerification | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  const verify = async () => {
    setVerifying(true)
    setError('')
    try {
      setResult(await verifyLegalConflict(conflict.id))
    } catch (err: unknown) {
      setResult(null)
      setError(err instanceof Error ? err.message : 'No se pudo verificar la integridad del acta.')
    } finally {
      setVerifying(false)
    }
  }

  const overall = result ? INTEGRITY_STATUS_CONFIG[result.status] : null

  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Integridad del documento
          </Typography>
          <DocumentIdentity uuid={conflict.documentUuid} hash={conflict.digitalSignHash} />
        </Box>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<VerifiedUserOutlinedIcon />}
          onClick={() => void verify()}
          disabled={verifying}
          sx={{ textTransform: 'none' }}
        >
          {verifying ? 'Verificando…' : 'Verificar integridad'}
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {result && overall && (
        <Box
          role="status"
          aria-label="Resultado de la verificación"
          sx={{ border: '1px solid', borderColor: overall.color, borderRadius: 2, p: 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2">Resultado:</Typography>
            <IntegrityBadge status={result.status} />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {overall.description}
          </Typography>

          <Stack spacing={0.75} sx={{ mt: 1.5 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Acta original:</Typography>
                <IntegrityBadge status={result.conflictStatus} />
              </Box>
              {result.reasons.map((reason) => (
                <Typography key={reason} variant="caption" color="text.secondary" component="div">
                  {INTEGRITY_REASON_LABELS[reason]}
                </Typography>
              ))}
            </Box>

            {result.attachments.map((attachment) => (
              <Box key={attachment.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">{attachmentLabel(attachment.id)}:</Typography>
                  <IntegrityBadge status={attachment.status} />
                </Box>
                {attachment.reasons.map((reason) => (
                  <Typography key={reason} variant="caption" color="text.secondary" component="div">
                    {INTEGRITY_REASON_LABELS[reason]}
                  </Typography>
                ))}
              </Box>
            ))}

            <Typography
              variant="body2"
              sx={{ color: result.signature.status === 'MISMATCH' ? '#dc2626' : 'text.secondary' }}
            >
              {SIGNATURE_STATUS_LABELS[result.signature.status]}
            </Typography>
          </Stack>

          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
            Verificado el {formatDateTime(result.verifiedAt, { seconds: true })}
          </Typography>
        </Box>
      )}
    </Stack>
  )
}
