import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'

import templateUrl from '@/assets/rite/RITE_2025_orientada.pdf?url'
import type { RiteDocument, RiteStatus } from '@/services/rite.service'
import { formatScore } from '@/utils/grades'
import { intensificationText } from '@/utils/rite'

// El formulario oficial es A4 apaisado. pdf-lib mide en puntos desde abajo a la izquierda,
// pero las posiciones de acá están en milímetros desde arriba a la izquierda (como se ve la hoja).
const PAGE_HEIGHT_PT = 595.276
const MM_TO_PT = 72 / 25.4
const toX = (mm: number) => mm * MM_TO_PT
const toY = (mm: number) => PAGE_HEIGHT_PT - mm * MM_TO_PT

// El formulario de secundaria orientada tiene 12 renglones de materias.
const SUBJECT_ROWS = 12

// Altura (en mm) de los renglones "1º C" y "2º C" de cada materia, medida sobre el formulario.
const FIRST_TERM_ROW_Y = [70.9, 78.8, 86.0, 93.9, 101.3, 109.2, 116.3, 124.1, 131.6, 139.4, 146.5, 154.4]
const SECOND_TERM_ROW_Y = [74.5, 82.3, 89.6, 97.4, 104.9, 112.7, 119.8, 127.7, 135.2, 143.0, 150.1, 158.0]

// Centro horizontal (en mm) de cada columna de la tabla de materias.
const COLUMN_X = {
  type: 14.5,
  gradeLevel: 72,
  assessment1: 84.5,
  score1: 99.5,
  assessment2: 114.5,
  score2: 129.75,
  intensification1: 144.75,
  december: 159,
  february: 173.5,
  finalScore: 188.75,
}
const SUBJECT_NAME_X = 21
const OBSERVATION_X = 201.5

const BLACK = rgb(0, 0, 0)
const RED = rgb(0.77, 0.13, 0.12)
const BLUE = rgb(0, 0.68, 0.94)

const SHIFT_NAMES: Record<string, string> = {
  MORNING: 'Mañana',
  AFTERNOON: 'Tarde',
  EVENING: 'Vespertino',
  EXTRA_TIME: 'Contraturno',
}

const show = (value: string | number | null | undefined) =>
  value === null || value === undefined ? '' : String(value)

const formatAbsences = (value: number) =>
  value.toLocaleString('es-AR', { maximumFractionDigits: 2 })

const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('es-AR') : ''

interface Fonts {
  regular: PDFFont
  bold: PDFFont
}

interface TextOptions {
  size?: number
  bold?: boolean
  align?: 'left' | 'center'
  maxWidth?: number // en mm
  color?: RGB
}

// Recorta un texto con "…" si no entra en el ancho disponible.
function fitText(text: string, font: PDFFont, size: number, maxWidthPt: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidthPt) return text
  let result = text
  while (result.length > 0 && font.widthOfTextAtSize(`${result}…`, size) > maxWidthPt) {
    result = result.slice(0, -1)
  }
  return `${result}…`
}

// Escribe un texto en la posición indicada (x e y en mm; y es la línea de base del texto).
function drawText(
  page: PDFPage,
  fonts: Fonts,
  text: string,
  xMm: number,
  yMm: number,
  options: TextOptions = {}
) {
  if (!text) return
  const font = options.bold ? fonts.bold : fonts.regular
  const size = options.size ?? 7
  const value = options.maxWidth ? fitText(text, font, size, options.maxWidth * MM_TO_PT) : text
  const width = font.widthOfTextAtSize(value, size)
  const x = options.align === 'center' ? toX(xMm) - width / 2 : toX(xMm)
  page.drawText(value, { x, y: toY(yMm), size, font, color: options.color ?? BLACK })
}

// Descarga el PDF generado en el navegador.
function downloadBytes(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Completa el formulario oficial RITE 2025 de la DGCyE (secundaria orientada) con los datos del
// alumno y lo descarga.
export async function downloadRitePdf(doc: RiteDocument, status: RiteStatus) {
  const response = await fetch(templateUrl)
  if (!response.ok) throw new Error('No se pudo cargar el formulario oficial del RITE')

  const pdf = await PDFDocument.load(await response.arrayBuffer())
  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  }
  const [firstPage, secondPage] = pdf.getPages()

  // ---------- Página 1: encabezado ----------
  const header = { size: 8, bold: true }
  const section = doc.section
  // El formulario tiene un solo campo "Escuela": va el nombre con el número
  const school = `${doc.institution.name} N° ${doc.institution.number}`
  drawText(firstPage, fonts, school, 23.3, 30.2, { ...header, maxWidth: 119 })
  drawText(firstPage, fonts, doc.institution.district, 171, 30.2, { ...header, maxWidth: 102 })
  drawText(firstPage, fonts, String(doc.academicYear), 30.6, 36.5, header)
  drawText(firstPage, fonts, section ? `${section.grade}°` : '', 165.3, 36.5, header)
  drawText(firstPage, fonts, section?.division ?? '', 229.5, 36.5, header)
  drawText(
    firstPage,
    fonts,
    `${doc.student.lastName}, ${doc.student.firstName}  (DNI ${doc.student.dni})`,
    28.2,
    42.8,
    { ...header, maxWidth: 115 }
  )
  drawText(
    firstPage,
    fonts,
    section ? (SHIFT_NAMES[section.shift] ?? section.shift) : '',
    168.6,
    42.8,
    header
  )

  // Marcas entre el título y el encabezado: la versión post-intensificación y, si no está
  // firmado, el borrador.
  let markX = 9.2
  if (doc.isPostIntensification) {
    const postLabel = 'VERSIÓN POST-INTENSIFICACIÓN'
    drawText(firstPage, fonts, postLabel, markX, 24.6, { size: 7, bold: true, color: BLUE })
    markX += fonts.bold.widthOfTextAtSize(postLabel, 7) / MM_TO_PT + 4
  }
  // Un RITE sin firmar no es un documento oficial: se aclara arriba.
  if (status !== 'SIGNED') {
    drawText(firstPage, fonts, 'BORRADOR - SIN FIRMAR', markX, 24.6, {
      size: 7,
      bold: true,
      color: RED,
    })
  }

  // ---------- Página 1: tabla de materias ----------
  doc.subjects.slice(0, SUBJECT_ROWS).forEach((subject, index) => {
    const firstRowY = FIRST_TERM_ROW_Y[index]
    const secondRowY = SECOND_TERM_ROW_Y[index]
    // Los datos de la materia van centrados entre los dos renglones (1º C y 2º C).
    const valueY = (firstRowY + secondRowY) / 2 + 2.1
    const centered = { align: 'center' as const }

    drawText(firstPage, fonts, subject.type, COLUMN_X.type, valueY, centered)
    drawText(firstPage, fonts, subject.subjectName, SUBJECT_NAME_X, valueY, { maxWidth: 44 })
    drawText(firstPage, fonts, `${subject.gradeLevel}°`, COLUMN_X.gradeLevel, valueY, centered)
    drawText(firstPage, fonts, show(subject.term1.preliminaryAssessment), COLUMN_X.assessment1, valueY, centered)
    drawText(firstPage, fonts, show(subject.term1.score), COLUMN_X.score1, valueY, centered)
    drawText(firstPage, fonts, show(subject.term2?.preliminaryAssessment), COLUMN_X.assessment2, valueY, centered)
    drawText(firstPage, fonts, show(subject.term2?.score), COLUMN_X.score2, valueY, centered)
    // Nota con la que recuperó el 1° cuatrimestre durante el 2°
    const term1Intensification = subject.term1IntensificationScore
    drawText(firstPage, fonts, typeof term1Intensification === 'number' ? formatScore(term1Intensification) : '', COLUMN_X.intensification1, valueY, centered)
    // Diciembre y febrero: con AA, la nota; con CCA o CSA, el código
    drawText(firstPage, fonts, intensificationText(subject.intensification?.december), COLUMN_X.december, valueY, centered)
    drawText(firstPage, fonts, intensificationText(subject.intensification?.february), COLUMN_X.february, valueY, centered)
    // La nota final puede tener decimales (7,5): se imprime con coma
    const finalScore = subject.finalScore === null ? '' : formatScore(subject.finalScore)
    drawText(firstPage, fonts, finalScore, COLUMN_X.finalScore, valueY, centered)

    // Observaciones: al lado de "1º C:" y "2º C:", que ya están impresos en el formulario.
    // Si son muy largas, se recortan con "…" para que no se salgan del casillero.
    const observation = { size: 4.5, maxWidth: 85 }
    drawText(firstPage, fonts, subject.term1.observations ?? '', OBSERVATION_X, firstRowY + 1.5, observation)
    drawText(firstPage, fonts, subject.term2?.observations ?? '', OBSERVATION_X, secondRowY + 1.5, observation)
  })

  // El formulario oficial tiene 12 renglones: si el alumno tiene más materias, se avisa en el documento.
  const omittedSubjects = doc.subjects.length - SUBJECT_ROWS
  if (omittedSubjects > 0) {
    drawText(
      firstPage,
      fonts,
      `ATENCIÓN: ${omittedSubjects} materia(s) no entran en los ${SUBJECT_ROWS} renglones del formulario oficial.`,
      60,
      164.6,
      { size: 6, bold: true, color: RED }
    )
  }

  // ---------- Página 2: días hábiles e inasistencias ----------
  // La tabla de materias pendientes (MPAA) queda en blanco: es de la etapa 3.
  const attendance = doc.attendance
  const centered = { align: 'center' as const, size: 8 }
  drawText(secondPage, fonts, String(attendance.term1.schoolDays), 49.1, 111.4, centered)
  drawText(secondPage, fonts, show(attendance.term2?.schoolDays), 81.5, 111.4, centered)
  drawText(secondPage, fonts, String(attendance.totalSchoolDays), 111.7, 111.4, centered)
  drawText(secondPage, fonts, formatAbsences(attendance.term1.absences), 49.1, 122.7, centered)
  drawText(
    secondPage,
    fonts,
    attendance.term2 ? formatAbsences(attendance.term2.absences) : '',
    81.5,
    122.7,
    centered
  )
  drawText(secondPage, fonts, formatAbsences(attendance.totalAbsences), 111.7, 122.7, centered)

  // ---------- Página 2: notificaciones ----------
  // Cada RITE firmado completa su columna con la fecha y la autoridad que firmó.
  // El post-intensificación se firma en la columna "Calificación final" del formulario.
  const notifications = [
    { term: 'FIRST', post: false, x: 204 },
    { term: 'SECOND', post: false, x: 257.7 },
    { term: 'SECOND', post: true, x: 279.5 },
  ] as const
  for (const { term, post, x } of notifications) {
    const signed = doc.notifications.find(
      (item) =>
        item.term === term && Boolean(item.isPostIntensification) === post && item.status === 'SIGNED'
    )
    if (!signed) continue
    drawText(secondPage, fonts, formatDate(signed.signedAt), x, 109.3, { align: 'center', size: 7 })
    drawText(secondPage, fonts, signed.signedBy ?? '', x, 117.9, {
      align: 'center',
      size: 6.5,
      maxWidth: post ? 15 : 25,
    })
  }

  const termCode = doc.isPostIntensification ? 'POST' : doc.term === 'FIRST' ? '1C' : '2C'
  downloadBytes(
    await pdf.save(),
    `RITE_${doc.student.lastName}_${doc.student.firstName}_${doc.academicYear}_${termCode}.pdf`
  )
}