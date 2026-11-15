// @vitest-environment jsdom
import { useState } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { AttachmentPicker } from '@/components/common/AttachmentPicker'

afterEach(cleanup)

const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  ),
  (char) => char.charCodeAt(0)
)

// El selector es controlado: este envoltorio guarda la lista como lo hace un formulario
function Harness() {
  const [files, setFiles] = useState<File[]>([])
  return (
    <>
      <AttachmentPicker files={files} onChange={setFiles} checkPdfs allowMergePhotos />
      <output aria-label="archivos">{files.map((file) => file.name).join('|')}</output>
    </>
  )
}

const choose = (container: HTMLElement, files: File[]) =>
  fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
    target: { files },
  })

describe('selector de evidencias con PDF (CRM-060)', () => {
  it('no agrega un PDF dañado y avisa por qué', async () => {
    const { container } = render(<Harness />)
    choose(container, [new File(['%PDF-1.7 roto'], 'roto.pdf', { type: 'application/pdf' })])

    expect(await screen.findByText(/no se agregó "roto.pdf" está dañado/i)).toBeTruthy()
    expect(screen.getByLabelText('archivos').textContent).toBe('')
  })

  it('con dos fotos ofrece unirlas, y el PDF reemplaza a las fotos', async () => {
    const { container } = render(<Harness />)
    choose(container, [
      new File([PNG], 'hoja1.png', { type: 'image/png' }),
      new File([PNG], 'hoja2.png', { type: 'image/png' }),
    ])

    fireEvent.click(await screen.findByRole('button', { name: 'Unir fotos en un PDF' }))
    fireEvent.change(screen.getByLabelText('Nombre del PDF'), { target: { value: 'TP Lengua' } })
    fireEvent.click(screen.getByRole('button', { name: 'Unir' }))

    await waitFor(() => expect(screen.getByLabelText('archivos').textContent).toBe('TP Lengua.pdf'))
    expect(screen.getByText(/PDF · 2 páginas/)).toBeTruthy()
  })
})
