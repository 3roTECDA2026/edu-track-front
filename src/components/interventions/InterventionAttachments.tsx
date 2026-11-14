import { AttachmentList } from '@/components/common/AttachmentList'
import {
  downloadInterventionAttachment,
  listInterventionAttachments,
} from '@/services/interventions.service'

interface InterventionAttachmentsProps {
  interventionId: string
}

// Adjuntos de una intervención, con opción de descargarlos (CRM-087, criterio 5).
// La lista y la descarga son las comunes de components/common.
export const InterventionAttachments = ({ interventionId }: InterventionAttachmentsProps) => (
  <AttachmentList
    resourceKey={`attachments:${interventionId}`}
    load={(signal) => listInterventionAttachments(interventionId, signal)}
    download={(attachment) => downloadInterventionAttachment(interventionId, attachment.id)}
    emptyText="Esta intervención no tiene adjuntos."
  />
)

export default InterventionAttachments
