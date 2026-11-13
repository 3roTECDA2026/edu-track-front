import { describe, expect, it } from 'vitest'

import {
  formatFileSize,
  isImageFile,
  MAX_ATTACHMENT_SIZE_BYTES,
  validateAttachmentFiles,
} from '@/components/interventions/attachmentRules'

// Crea un File de prueba con el tamaño indicado (sin ocupar esa memoria de verdad).
function fakeFile(name: string, size = 100): File {
  const file = new File(['x'], name)
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('validateAttachmentFiles', () => {
  it('acepta jpg, png, pdf y docx', () => {
    const files = ['a.jpg', 'b.JPEG', 'c.png', 'd.pdf', 'e.docx'].map((n) => fakeFile(n))
    expect(validateAttachmentFiles(files)).toEqual([])
  })

  it('rechaza otros tipos de archivo', () => {
    const errors = validateAttachmentFiles([fakeFile('virus.exe'), fakeFile('planilla.xlsx')])
    expect(errors).toHaveLength(2)
    expect(errors[0]).toContain('virus.exe')
  })

  it('rechaza archivos de más de 10 MB', () => {
    const errors = validateAttachmentFiles([fakeFile('grande.pdf', MAX_ATTACHMENT_SIZE_BYTES + 1)])
    expect(errors).toEqual(['"grande.pdf": pesa más de 10 MB.'])
  })

  it('rechaza más de 10 archivos', () => {
    const files = Array.from({ length: 11 }, (_, i) => fakeFile(`f${i}.pdf`))
    expect(validateAttachmentFiles(files)).toHaveLength(1)
  })
})

describe('isImageFile y formatFileSize', () => {
  it('reconoce imágenes por tipo o por nombre', () => {
    expect(isImageFile('image/png')).toBe(true)
    expect(isImageFile('foto.JPG')).toBe(true)
    expect(isImageFile('application/pdf')).toBe(false)
  })

  it('muestra el tamaño en B, KB o MB', () => {
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(2048)).toBe('2 KB')
    expect(formatFileSize(3.5 * 1024 * 1024)).toBe('3,5 MB')
  })
})
