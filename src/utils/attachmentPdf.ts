import { PDFDocument } from 'pdf-lib'

// Ayudas para los PDF de los adjuntos (CRM-060), con pdf-lib, la misma librería del PDF del RITE.

export type PdfCheck = { ok: true; pages: number } | { ok: false; reason: 'encrypted' | 'damaged' }

// Revisa un PDF antes de subirlo: si está protegido con contraseña o dañado, no se puede abrir
// después desde el historial. Si abre, devuelve la cantidad de páginas.
export async function checkPdf(file: Blob): Promise<PdfCheck> {
  try {
    // Se abre ignorando el cifrado y después se pregunta si está cifrado: el error de pdf-lib
    // para los cifrados no se puede distinguir con instanceof en el build
    const pdf = await PDFDocument.load(await file.arrayBuffer(), {
      ignoreEncryption: true,
      updateMetadata: false,
    })
    if (pdf.isEncrypted) return { ok: false, reason: 'encrypted' }
    const pages = pdf.getPageCount()
    return pages > 0 ? { ok: true, pages } : { ok: false, reason: 'damaged' }
  } catch {
    return { ok: false, reason: 'damaged' }
  }
}

export const PDF_CHECK_MESSAGES: Record<'encrypted' | 'damaged', string> = {
  encrypted: 'está protegido con contraseña: no se va a poder abrir después.',
  damaged: 'está dañado o no es un PDF válido.',
}

// A4 en puntos (1/72 de pulgada), como el PDF del RITE
const A4 = { width: 595.28, height: 841.89 }
const MARGIN = 24

// Detecta el formato por los primeros bytes, no por la extensión (una foto puede venir mal nombrada)
const isPng = (bytes: Uint8Array) =>
  bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
const isJpg = (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff

// Une fotos (JPG o PNG) en un solo PDF A4, una por página y en el orden recibido. Pensado para
// trabajos en papel fotografiados hoja por hoja. Cada foto se escala para entrar en la página,
// sin deformarla; si es apaisada, la página también.
export async function photosToPdf(photos: File[], fileName: string): Promise<File> {
  const pdf = await PDFDocument.create()

  for (const photo of photos) {
    const bytes = new Uint8Array(await photo.arrayBuffer())
    const image = isPng(bytes)
      ? await pdf.embedPng(bytes)
      : isJpg(bytes)
        ? await pdf.embedJpg(bytes)
        : null
    if (!image) throw new Error(`"${photo.name}" no es una foto JPG o PNG.`)

    const landscape = image.width > image.height
    const pageWidth = landscape ? A4.height : A4.width
    const pageHeight = landscape ? A4.width : A4.height
    const scale = Math.min(
      (pageWidth - MARGIN * 2) / image.width,
      (pageHeight - MARGIN * 2) / image.height
    )
    const width = image.width * scale
    const height = image.height * scale

    const page = pdf.addPage([pageWidth, pageHeight])
    // Centrada en la página
    page.drawImage(image, {
      x: (pageWidth - width) / 2,
      y: (pageHeight - height) / 2,
      width,
      height,
    })
  }

  const bytes = await pdf.save()
  const name = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`
  // Copia a un Uint8Array común: el tipo que devuelve pdf-lib no entra directo en File
  return new File([new Uint8Array(bytes)], name, { type: 'application/pdf' })
}
