import { z } from 'zod'

import type { EdteMeetingPeriod } from '@/services/edteMeeting.service'

// Reglas de fecha de una reunión del EDTE (CRM-075). Son las mismas que valida el back
// (`assertMeetingDate` en edteMeeting.service): la fecha tiene que ser del año del ciclo y, solo
// en la reunión de febrero/marzo, de uno de esos dos meses. Para agosto, diciembre y las
// reuniones adicionales el back no exige un mes: si más adelante lo exige, se cambia acá y allá.
interface PeriodDateRule {
  months?: number[] // Meses permitidos (1 a 12); sin esto, cualquier mes del año
  hint: (year: number) => string
}

export const MEETING_DATE_RULES: Record<EdteMeetingPeriod, PeriodDateRule> = {
  FEBRUARY_MARCH: {
    months: [2, 3],
    hint: (year) => `Entre el 1 de febrero y el 31 de marzo de ${year}`,
  },
  AUGUST: { hint: (year) => `Cualquier fecha de ${year} (suele ser en agosto)` },
  DECEMBER: { hint: (year) => `Cualquier fecha de ${year} (suele ser en diciembre)` },
  ADDITIONAL: { hint: (year) => `Cualquier fecha de ${year}` },
}

export const meetingDateHint = (period: EdteMeetingPeriod, year: number) =>
  MEETING_DATE_RULES[period].hint(year)

// Devuelve el motivo si la fecha (AAAA-MM-DD) no sirve para ese período y ciclo, o null si sirve
export function meetingDateError(
  date: string,
  period: EdteMeetingPeriod,
  year: number
): string | null {
  if (!date) return null // "Elegí la fecha" lo informa el campo obligatorio
  const [dateYear, month] = date.split('-').map(Number)
  if (dateYear !== year) return `La fecha tiene que ser del año ${year}`
  const months = MEETING_DATE_RULES[period].months
  if (months && !months.includes(month ?? 0)) {
    return 'La reunión de febrero/marzo tiene que ser en febrero o marzo'
  }
  return null
}

// Datos generales del formulario de reunión del EDTE. Los integrantes y los alumnos se manejan
// aparte (useMeetingParticipants): un borrador puede estar incompleto.
export const edteMeetingFormSchema = z
  .object({
    year: z.number().int(),
    date: z
      .string()
      .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'La fecha no es válida')
      .min(1, 'Elegí la fecha'),
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
    const message = meetingDateError(data.date, data.period, data.year)
    if (message) context.addIssue({ code: 'custom', message, path: ['date'] })
  })

export type EdteMeetingFormValues = z.infer<typeof edteMeetingFormSchema>
