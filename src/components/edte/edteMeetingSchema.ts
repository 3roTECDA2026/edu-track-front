import { z } from 'zod'

// Datos generales del formulario de reunión del EDTE (CRM-075). Los integrantes y los alumnos
// se manejan aparte, con su propio estado.
export const edteMeetingFormSchema = z
  .object({
    year: z.number().int(),
    date: z.string().min(1, 'Elegí la fecha'),
    period: z.enum(['FEBRUARY_MARCH', 'AUGUST', 'DECEMBER', 'ADDITIONAL'], {
      error: 'Elegí el período',
    }),
    shift: z.enum(['', 'MORNING', 'AFTERNOON', 'EVENING', 'EXTRA_TIME']),
    considerations: z.string().max(5000, 'Máximo 5000 caracteres'),
    // Solo http y https, igual que el back: otros protocolos (javascript:, data:) son inseguros
    minutesUrl: z.union([
      z.literal(''),
      z
        .url({
          protocol: /^https?$/,
          error: 'El enlace tiene que ser una dirección web que empiece con http:// o https://',
        })
        .max(500),
    ]),
  })
  .superRefine((data, context) => {
    if (!data.date) return
    const [dateYear, month] = data.date.split('-').map(Number)
    // Mismas reglas que el back: año del ciclo y, en febrero/marzo, esos meses
    if (dateYear !== data.year) {
      context.addIssue({
        code: 'custom',
        message: `La fecha tiene que ser del año ${data.year}`,
        path: ['date'],
      })
    } else if (data.period === 'FEBRUARY_MARCH' && month !== 2 && month !== 3) {
      context.addIssue({
        code: 'custom',
        message: 'La reunión de febrero/marzo tiene que ser en febrero o marzo',
        path: ['date'],
      })
    }
  })

export type EdteMeetingFormValues = z.infer<typeof edteMeetingFormSchema>
