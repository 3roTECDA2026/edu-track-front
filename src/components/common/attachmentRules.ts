import { ApiError } from '@/services/api'

// Reglas de los adjuntos de una intervención (CRM-087). Son las mismas que valida el back
// (utils/attachmentFileType.ts): acá se revisan antes de subir para avisar enseguida,
// pero el back las vuelve a validar igual.

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB por archivo
export const MAX_ATTACHMENTS_PER_UPLOAD = 10
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf', '.docx']

// Valor para el atributo accept del <input type="file">: el selector muestra solo estos tipos.
export const ATTACHMENT_ACCEPT = ALLOWED_EXTENSIONS.join(',')

export const ATTACHMENT_RULES_TEXT = 'JPG, PNG, PDF o DOCX, hasta 10 MB cada uno'

function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot === -1 ? '' : fileName.slice(dot).toLowerCase()
}

// Devuelve un mensaje por cada problema; si la lista está vacía, los archivos se pueden subir.
export function validateAttachmentFiles(files: File[]): string[] {
  const errors: string[] = []
  if (files.length > MAX_ATTACHMENTS_PER_UPLOAD) {
    errors.push(`Se pueden adjuntar hasta ${MAX_ATTACHMENTS_PER_UPLOAD} archivos por vez.`)
  }
  for (const file of files) {
    if (!ALLOWED_EXTENSIONS.includes(getExtension(file.name))) {
      errors.push(`"${file.name}": tipo de archivo no permitido.`)
    } else if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      errors.push(`"${file.name}": pesa más de 10 MB.`)
    }
  }
  return errors
}

export function isImageFile(nameOrMimeType: string): boolean {
  const value = nameOrMimeType.toLowerCase()
  return value.startsWith('image/') || ['.jpg', '.jpeg', '.png'].includes(getExtension(value))
}

// 2048 → "2 KB"; 3500000 → "3,3 MB"
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('es-AR', { maximumFractionDigits: 1 })} MB`
}

// Mensaje claro para mostrar cuando falla una subida o una descarga.
// El back manda los errores de cada archivo en details.errors (400).
export function getAttachmentErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Tu sesión venció. Volvé a iniciar sesión.'
    const details = err.details as { errors?: unknown } | undefined
    if (Array.isArray(details?.errors) && details.errors.length > 0) {
      return `${err.message}: ${details.errors.join(' ')}`
    }
    return err.message || fallback
  }
  return err instanceof Error && err.message ? err.message : fallback
}
