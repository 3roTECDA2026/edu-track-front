import { ApiError } from '@/services/api'

// Mensaje para mostrarle al usuario cuando falla un pedido al back.
// Cuando el back rechaza datos (400 "Validation error"), el motivo real viene en details:
// - errores de Zod: details.fieldErrors ({ campo: ['mensaje'] }) y details.formErrors;
// - otros: details.errors (['mensaje']).
// Así se muestra "La fecha no puede ser futura" en vez de "Validation error".
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) {
    return err instanceof Error && err.message ? err.message : fallback
  }
  if (err.status === 401) return 'Tu sesión venció. Volvé a iniciar sesión.'

  const details = err.details as
    { fieldErrors?: Record<string, unknown>; formErrors?: unknown; errors?: unknown } | undefined
  const messages: string[] = []
  const collect = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach((item) => typeof item === 'string' && item && messages.push(item))
    }
  }
  collect(details?.formErrors)
  if (details?.fieldErrors) Object.values(details.fieldErrors).forEach(collect)
  collect(details?.errors)

  if (messages.length > 0) return [...new Set(messages)].join(' ')
  // "Validation error" es técnico: si no vino el detalle, mejor el texto de la pantalla
  if (err.message === 'Validation error') return fallback
  return err.message || fallback
}
