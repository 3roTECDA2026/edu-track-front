// Descarga un archivo que ya está en memoria (Blob) con el nombre indicado.
// Se usa para archivos que se pidieron con token, que no se pueden abrir con un <a href> común.
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Se libera después de un momento, para que el navegador llegue a empezar la descarga
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Abre un archivo en memoria (PDF o imagen) en una pestaña nueva, con el visor del navegador.
// Igual que saveBlob, para archivos que se pidieron con token.
export function openBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
  // Se libera después de un rato, cuando la pestaña nueva ya cargó el archivo
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
