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

// Abre la pestaña nueva en el momento del clic, todavía vacía: si se abre recién cuando llega el
// archivo (después de esperar la descarga), el navegador la puede bloquear como ventana emergente.
// Devuelve null si igual la bloqueó.
export function openBlankTab(): Window | null {
  const tab = window.open('', '_blank')
  // Sin acceso a esta página desde la pestaña nueva (lo que hace "noopener")
  if (tab) tab.opener = null
  return tab
}

// Muestra un archivo en memoria (PDF o imagen) en la pestaña abierta con openBlankTab, con el
// visor del navegador. Si la pestaña no se pudo abrir, lo descarga con su nombre.
export function openBlob(blob: Blob, tab: Window | null, fileName: string): void {
  if (!tab || tab.closed) {
    saveBlob(blob, fileName)
    return
  }
  const url = URL.createObjectURL(blob)
  tab.location.href = url
  // Se libera después de un rato, cuando la pestaña ya cargó el archivo
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
