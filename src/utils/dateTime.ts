// Fecha y hora para mostrar, en formato argentino de 24 horas: "17/11/2026, 21:25".
//
// No usar toLocaleString('es-AR') para fechas con hora: en ese locale el navegador usa reloj de
// 12 horas pero no agrega "a. m." / "p. m.", así que las 21:25 se ven como "09:25".
const dateTimeFormat = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const dateTimeWithSecondsFormat = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

// Devuelve null si el valor no es una fecha válida, para que cada pantalla elija su texto.
export function formatDateTime(
  value: string | Date,
  { seconds = false }: { seconds?: boolean } = {}
): string | null {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return (seconds ? dateTimeWithSecondsFormat : dateTimeFormat).format(date)
}
