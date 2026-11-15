import { PDFDocument, PDFName } from 'pdf-lib'
import { describe, expect, it } from 'vitest'

import { checkPdf, photosToPdf } from '@/utils/attachmentPdf'

// Foto PNG de 1 x 1 píxel
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0))

const pngFile = (name: string) => new File([fromBase64(PNG_BASE64)], name, { type: 'image/png' })

async function pdfFile(pages: number) {
  const pdf = await PDFDocument.create()
  for (let i = 0; i < pages; i++) pdf.addPage()
  return new File([new Uint8Array(await pdf.save())], 'tp.pdf', { type: 'application/pdf' })
}

describe('revisar un PDF antes de subirlo (CRM-060)', () => {
  it('un PDF válido devuelve la cantidad de páginas', async () => {
    expect(await checkPdf(await pdfFile(3))).toEqual({ ok: true, pages: 3 })
  })

  it('un archivo que no es un PDF, o está roto, se marca como dañado', async () => {
    const broken = new File(['%PDF-1.7 esto no es un PDF'], 'roto.pdf')
    expect(await checkPdf(broken)).toEqual({ ok: false, reason: 'damaged' })
  })

  it('un PDF protegido con contraseña se marca como protegido', async () => {
    // pdf-lib no cifra: se simula con la entrada /Encrypt del trailer, que es lo que mira al abrir
    const pdf = await PDFDocument.create()
    pdf.addPage()
    pdf.context.trailerInfo.Encrypt = pdf.context.obj({ Filter: PDFName.of('Standard') })
    const encrypted = new File([new Uint8Array(await pdf.save())], 'protegido.pdf')
    expect(await checkPdf(encrypted)).toEqual({ ok: false, reason: 'encrypted' })
  })
})

describe('unir fotos en un PDF (CRM-060)', () => {
  it('arma un PDF con una página por foto, con el nombre pedido', async () => {
    const result = await photosToPdf(
      [pngFile('hoja1.png'), pngFile('hoja2.png'), pngFile('hoja3.png')],
      'TP Matemática'
    )
    expect(result.name).toBe('TP Matemática.pdf')
    expect(result.type).toBe('application/pdf')
    expect(await checkPdf(result)).toEqual({ ok: true, pages: 3 })
  })

  it('rechaza un archivo que no es una foto', async () => {
    const notPhoto = new File(['hola'], 'nota.png')
    await expect(photosToPdf([notPhoto], 'x')).rejects.toThrow('no es una foto')
  })
})
