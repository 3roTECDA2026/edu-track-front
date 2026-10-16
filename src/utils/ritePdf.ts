import { jsPDF } from 'jspdf'
import autoTable, { type CellDef, type RowInput } from 'jspdf-autotable'

import encodeSansBoldUrl from '@/assets/rite/fonts/EncodeSans-Bold.ttf'
import encodeSansRegularUrl from '@/assets/rite/fonts/EncodeSans-Regular.ttf'
import footerLogoUrl from '@/assets/rite/logo-pba-footer.png'
import headerLogoUrl from '@/assets/rite/logo-pba-header.png'
import type { RiteDocument, RiteStatus } from '@/services/rite.service'

// Todas las medidas están tomadas del formulario oficial RITE 2025 (A4 apaisado, en milímetros).
const MARGIN_LEFT = 9
const TABLE_WIDTH = 279.5

// Colores del formulario oficial: celeste de encabezados y grises alternados de las filas.
const BLUE: [number, number, number] = [0, 174, 239]
const ROW_DARK: [number, number, number] = [226, 228, 230]
const ROW_LIGHT: [number, number, number] = [241, 242, 243]
const WHITE: [number, number, number] = [255, 255, 255]

// Mismas cantidades de filas que el formulario impreso.
const SUBJECT_ROWS = 17
const MPAA_ROWS = 8

// Ancho de cada columna, medido sobre el formulario oficial.
const SUBJECT_COLUMNS = [11, 47, 10, 15, 15, 15, 15.5, 14.5, 14, 15, 15.5, 92]
const MPAA_COLUMNS = [11, 46.5, 11.5, 60.8, 12.15, 12.15, 12.15, 12.15, 12.15, 12.15, 15.4, 61.4]
const ATTENDANCE_COLUMNS = [25.8, 29.6, 35.2, 25.2]
const NOTIFICATION_COLUMNS = [10.8, 25.7, 26, 27, 27, 26.5, 17]

// Texto institucional de arriba a la derecha, igual que el formulario oficial.
const HEADER_LINES = [
  'SUBSECRETARÍA DE EDUCACIÓN',
  'DIRECCIÓN PROVINCIAL DE EDUCACIÓN TÉCNICO PROFESIONAL',
  'DIRECCIÓN DE EDUCACIÓN TÉCNICA',
  'DIRECCIÓN DE EDUCACIÓN AGRARIA',
]

const OFFICIAL_FONT = 'EncodeSans'

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

// Convierte la lista de anchos al formato de columnas que usa autoTable.
const toColumnStyles = (widths: number[]) =>
  Object.fromEntries(widths.map((width, index) => [index, { cellWidth: width }]))

// Posición vertical donde terminó la última tabla dibujada.
const lastTableY = (pdf: jsPDF) =>
  (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY

// Estilo de las celdas de título dentro de una tabla (fondo celeste, letra blanca).
const labelStyles = { fillColor: BLUE, textColor: 255, fontStyle: 'bold' as const }

// Carga una imagen para poder insertarla en el PDF.
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`No se pudo cargar la imagen ${url}`))
    image.src = url
  })
}

// Inserta una imagen con un ancho dado, respetando su proporción.
function addImageByWidth(pdf: jsPDF, image: HTMLImageElement, x: number, y: number, width: number) {
  const height = (image.naturalHeight / image.naturalWidth) * width
  pdf.addImage(image, 'PNG', x, y, width, height)
  return height
}

// Descarga un archivo y lo convierte a base64, que es como jsPDF recibe las fuentes.
async function toBase64(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(index, index + chunkSize)))
  }
  return btoa(binary)
}

// Registra la tipografía del formulario oficial (Encode Sans). Si no se puede cargar, usa Helvetica.
async function registerOfficialFont(pdf: jsPDF) {
  try {
    const [regular, bold] = await Promise.all([
      toBase64(encodeSansRegularUrl),
      toBase64(encodeSansBoldUrl),
    ])
    pdf.addFileToVFS('EncodeSans-Regular.ttf', regular)
    pdf.addFont('EncodeSans-Regular.ttf', OFFICIAL_FONT, 'normal')
    pdf.addFileToVFS('EncodeSans-Bold.ttf', bold)
    pdf.addFont('EncodeSans-Bold.ttf', OFFICIAL_FONT, 'bold')
    return OFFICIAL_FONT
  } catch {
    return 'helvetica'
  }
}

// Dibuja un dato del encabezado sobre una línea punteada, como en el formulario impreso.
function drawField(
  pdf: jsPDF,
  font: string,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
) {
  pdf.setFont(font, 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(60)
  pdf.text(label, x, y)

  const valueX = x + pdf.getTextWidth(label) + 1
  pdf.setFont(font, 'bold')
  pdf.setTextColor(0)
  pdf.text(value, valueX + 1, y - 0.3)

  pdf.setDrawColor(150)
  pdf.setLineDashPattern([0.3, 0.7], 0)
  pdf.line(valueX, y + 0.7, x + width, y + 0.7)
  pdf.setLineDashPattern([], 0)
}

interface NoteStyle {
  fontSize: number
  lineHeight: number
  gap: number
}

// Escribe una columna de notas. Cada nota puede empezar con un título en negrita.
function drawNotesColumn(
  pdf: jsPDF,
  font: string,
  notes: { title?: string; text: string }[],
  x: number,
  y: number,
  width: number,
  style: NoteStyle
) {
  let currentY = y
  pdf.setFontSize(style.fontSize)
  pdf.setTextColor(0)

  for (const note of notes) {
    let text = note.text
    if (note.title) {
      pdf.setFont(font, 'bold')
      pdf.text(note.title, x, currentY)
      // El texto sigue en la misma línea, después del título.
      pdf.setFont(font, 'normal')
      const spaces = Math.ceil(pdf.getTextWidth(`${note.title} `) / pdf.getTextWidth(' '))
      text = `${' '.repeat(spaces)}${note.text}`
    }
    pdf.setFont(font, 'normal')
    const lines = pdf.splitTextToSize(text, width)
    pdf.text(lines, x, currentY, { lineHeightFactor: style.lineHeight / (style.fontSize * 0.3528) })
    currentY += lines.length * style.lineHeight + style.gap
  }
  return currentY
}

// Genera y descarga el PDF del RITE con la estructura del formulario oficial de la DGCyE.
export async function downloadRitePdf(doc: RiteDocument, status: RiteStatus) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const [font, headerLogo, footerLogo] = await Promise.all([
    registerOfficialFont(pdf),
    loadImage(headerLogoUrl),
    loadImage(footerLogoUrl),
  ])

  // Estilos comunes a todas las tablas: separadores blancos y la tipografía oficial.
  const baseStyles = {
    font,
    valign: 'middle' as const,
    halign: 'center' as const,
    lineColor: WHITE,
    lineWidth: 0.5,
    textColor: 40,
  }
  const headStyles = { fillColor: BLUE, textColor: 255, fontStyle: 'bold' as const }

  // ---------- Página 1: título, texto institucional y logo ----------
  pdf.setFont(font, 'bold')
  pdf.setFontSize(15)
  pdf.setTextColor(...BLUE)
  pdf.text('REGISTRO INSTITUCIONAL DE TRAYECTORIAS EDUCATIVAS', 9.2, 12.4)

  pdf.setFontSize(6.8)
  pdf.setTextColor(150)
  HEADER_LINES.forEach((line, index) => pdf.text(line, 270.6, 8.7 + index * 2.8, { align: 'right' }))
  addImageByWidth(pdf, headerLogo, 273.5, 5.5, 12)

  // Un RITE sin firmar no es un documento oficial: se aclara arriba.
  if (status !== 'SIGNED') {
    pdf.setFontSize(7)
    pdf.setTextColor(197, 34, 31)
    pdf.text('BORRADOR - SIN FIRMAR', 9.2, 17.5)
  }

  // ---------- Página 1: datos del encabezado ----------
  const section = doc.section
  drawField(pdf, font, 'INSTITUCIÓN:', doc.institution.name, 9.2, 24.3, 100)
  drawField(pdf, font, 'N°', doc.institution.number, 110, 24.3, 37.5)
  drawField(pdf, font, 'CICLO LECTIVO:', String(doc.academicYear), 9.2, 29.5, 138.8)
  drawField(
    pdf,
    font,
    'ESTUDIANTE:',
    `${doc.student.lastName}, ${doc.student.firstName}  (DNI ${doc.student.dni})`,
    9.2,
    34.7,
    138.7
  )
  drawField(pdf, font, 'DISTRITO:', doc.institution.district, 156.6, 24.3, 121)
  drawField(pdf, font, 'AÑO:', section ? `${section.grade}°` : '', 156.6, 29.5, 69.5)
  drawField(pdf, font, 'SECCIÓN:', section?.division ?? '', 228, 29.5, 49.5)
  drawField(
    pdf,
    font,
    'TURNO:',
    section ? (SHIFT_NAMES[section.shift] ?? section.shift) : '',
    156.6,
    34.7,
    121.3
  )

  // ---------- Página 1: tabla de materias ----------
  // Cada materia ocupa dos renglones: el de arriba con las observaciones del 1° C y el de abajo con las del 2° C.
  const subjectRows: RowInput[] = []
  const totalSubjects = Math.max(doc.subjects.length, SUBJECT_ROWS)

  for (let index = 0; index < totalSubjects; index++) {
    const subject = doc.subjects[index]
    const fill = index % 2 === 0 ? ROW_DARK : ROW_LIGHT
    const spanned = (content: string, halign: 'left' | 'center' = 'center'): CellDef => ({
      content,
      rowSpan: 2,
      styles: { fillColor: fill, halign },
    })
    const observation = (content: string): CellDef => ({
      content,
      styles: { fillColor: fill, halign: 'left', fontSize: 4.5 },
    })

    subjectRows.push([
      spanned(subject?.type ?? ''),
      spanned(subject?.subjectName ?? '', 'left'),
      spanned(subject ? `${subject.gradeLevel}°` : ''),
      spanned(show(subject?.term1.preliminaryAssessment)),
      spanned(show(subject?.term1.score)),
      spanned(show(subject?.term2?.preliminaryAssessment)),
      spanned(show(subject?.term2?.score)),
      spanned(''), // intensificación 1° cuatrimestre: el esquema todavía no guarda esa nota
      spanned(show(subject?.intensification?.december)),
      spanned(show(subject?.intensification?.february)),
      spanned(show(subject?.finalScore)),
      observation(`1º C: ${subject?.term1.observations ?? ''}`),
    ])
    subjectRows.push([observation(`2º C: ${subject?.term2?.observations ?? ''}`)])
  }

  autoTable(pdf, {
    startY: 37.5,
    margin: { left: MARGIN_LEFT },
    tableWidth: TABLE_WIDTH,
    theme: 'grid',
    styles: {
      ...baseStyles,
      fontSize: 7,
      cellPadding: { top: 0.3, bottom: 0.3, left: 1, right: 1 },
      minCellHeight: 3.75,
      overflow: 'linebreak',
    },
    headStyles: { ...headStyles, cellPadding: 0.5 },
    head: [
      [
        { content: 'TIPO\n(C-R)', rowSpan: 3, styles: { fontSize: 8 } },
        { content: 'MATERIAS', rowSpan: 3, styles: { fontSize: 9 } },
        { content: 'AÑO', rowSpan: 3, styles: { fontSize: 9 } },
        { content: 'CALIFICACIONES', colSpan: 8, styles: { fontSize: 8.5, minCellHeight: 5 } },
        { content: 'OBSERVACIONES', rowSpan: 3, styles: { fontSize: 9 } },
      ],
      [
        { content: '1º CUATRIMESTRE', colSpan: 2, styles: { fontSize: 7, minCellHeight: 5.5 } },
        { content: '2º CUATRIMESTRE', colSpan: 3, styles: { fontSize: 7 } },
        { content: 'INTENSIFICACIÓN', colSpan: 2, styles: { fontSize: 7 } },
        { content: 'CALIFICACIÓN\nFINAL', rowSpan: 2, styles: { fontSize: 5.6 } },
      ],
      [
        { content: '1º VALORACIÓN\nPRELIMINAR', styles: { fontSize: 5.6, minCellHeight: 9 } },
        { content: 'CALIFICACIÓN', styles: { fontSize: 5.6 } },
        { content: '2º VALORACIÓN\nPRELIMINAR', styles: { fontSize: 5.6 } },
        { content: 'CALIFICACIÓN', styles: { fontSize: 5.6 } },
        { content: 'INTENSIFICACIÓN\n1º CUATRIMESTRE', styles: { fontSize: 4.6 } },
        { content: 'DICIEMBRE', styles: { fontSize: 5.6 } },
        { content: 'FEBRERO', styles: { fontSize: 5.6 } },
      ],
    ],
    body: subjectRows,
    columnStyles: toColumnStyles(SUBJECT_COLUMNS),
  })

  // ---------- Página 1: notas en dos columnas, como el formulario oficial ----------
  const firstPageNotes: NoteStyle = { fontSize: 6.5, lineHeight: 2.7, gap: 1.3 }
  const notesY = Math.max(190.8, lastTableY(pdf) + 4)

  pdf.setFont(font, 'bold')
  pdf.setFontSize(7)
  pdf.setTextColor(0)
  pdf.text('NOTAS', 9.9, notesY)

  drawNotesColumn(
    pdf,
    font,
    [
      {
        text: 'En «Tipo» de materia debe indicarse «C» si la materia se cursa por primera vez y «R» si se recursa; debe indicarse el año de estudio. Se deben listar en primer lugar las materias que se cursan por primera vez y, luego, las recursadas.',
      },
      { title: 'VALORACIÓN PRELIMINAR:', text: 'debe completarse con TEA, TEP, TED.' },
      {
        title: 'CALIFICACIÓN DEL CUATRIMESTRE:',
        text: 'resultará de la ponderación de las valoraciones parciales cualitativas y cuantitativas obtenidas por la/el estudiante, dando cuenta de su proceso de aprendizaje durante el periodo, a través de diversos instrumentos y/o instancias evaluativas.',
      },
    ],
    19,
    notesY,
    119,
    firstPageNotes
  )
  drawNotesColumn(
    pdf,
    font,
    [
      {
        title: 'INTENSIFICACIÓN 1° CUATRIMESTRE:',
        text: 'debe completarse sólo si el estudiante obtuvo originalmente una calificación menor a 7 en el primer cuatrimestre y, durante el transcurso del 2° cuatrimestre intensifica los saberes pendientes logrando una calificación de 7 o más.',
      },
      {
        title: 'CALIFICACIÓN FINAL:',
        text: 'se registrará al momento en que la materia haya sido aprobada o acreditada o al cierre del ciclo lectivo, sea que la materia haya sido aprobada y acreditada o que quede pendiente de aprobación y acreditación; cuando la/el estudiante haya obtenido una calificación de 7 a 10 en cada cuatrimestre, la calificación final de la materia será el promedio de las calificaciones de ambos cuatrimestres.',
      },
    ],
    159,
    notesY,
    119,
    firstPageNotes
  )

  // ---------- Página 2: materias pendientes (MPAA) ----------
  pdf.addPage()

  // Por ahora la tabla sale vacía: las materias pendientes son de la parte 2 de la tarea.
  const mpaaRows: RowInput[] = Array.from({ length: MPAA_ROWS }, (_, index) => {
    const fill = index % 2 === 0 ? ROW_DARK : ROW_LIGHT
    return Array.from({ length: 12 }, (_, column) => ({
      content: column === 0 ? `${index + 1}.` : '',
      styles: { fillColor: fill, textColor: 110, fontSize: 6.8 },
    }))
  })

  autoTable(pdf, {
    startY: 12.5,
    margin: { left: MARGIN_LEFT },
    tableWidth: TABLE_WIDTH,
    theme: 'grid',
    styles: { ...baseStyles, fontSize: 7, cellPadding: 0.5, minCellHeight: 7.6 },
    headStyles: { ...headStyles, cellPadding: 0.6 },
    head: [
      [
        {
          content: 'MATERIAS PENDIENTES DE APROBACIÓN Y ACREDITACIÓN - INTENSIFICACIÓN',
          colSpan: 12,
          styles: { fontSize: 8.3, minCellHeight: 5.5 },
        },
      ],
      [
        { content: '', rowSpan: 2 },
        { content: 'MATERIAS', rowSpan: 2, styles: { fontSize: 9 } },
        { content: 'AÑO', rowSpan: 2, styles: { fontSize: 9 } },
        {
          content: 'SABERES INICIALES\nPENDIENTES DE APROBACIÓN\nAL INICIO DEL CICLO LECTIVO',
          rowSpan: 2,
          styles: { fontSize: 8.3 },
        },
        {
          content: 'PERIODO DE INTENSIFICACIÓN',
          colSpan: 6,
          styles: { fontSize: 8.3, minCellHeight: 7.5 },
        },
        { content: 'CALIFICACIÓN\nFINAL', rowSpan: 2, styles: { fontSize: 5.6 } },
        {
          content: 'SABERES PENDIENTES DE APROBACIÓN\nAL CIERRE DEL CICLO LECTIVO',
          rowSpan: 2,
          styles: { fontSize: 8.3 },
        },
      ],
      [
        { content: 'MARZO', styles: { fontSize: 5.6, minCellHeight: 8 } },
        { content: 'JULIO', styles: { fontSize: 5.6 } },
        { content: 'AGOSTO', styles: { fontSize: 5.6 } },
        { content: 'DICIEMBRE\n1', styles: { fontSize: 5.6 } },
        { content: 'DICIEMBRE\n2', styles: { fontSize: 5.6 } },
        { content: 'FEBRERO', styles: { fontSize: 5.6 } },
      ],
    ],
    body: mpaaRows,
    columnStyles: toColumnStyles(MPAA_COLUMNS),
  })

  // Notas de la tabla de materias pendientes, en dos columnas.
  const secondPageNotes: NoteStyle = { fontSize: 7.5, lineHeight: 3.2, gap: 1.4 }
  const mpaaNotesY = lastTableY(pdf) + 5.5

  pdf.setFont(font, 'bold')
  pdf.setFontSize(7.5)
  pdf.setTextColor(0)
  pdf.text('NOTAS', 10.6, mpaaNotesY)

  const leftNotesEnd = drawNotesColumn(
    pdf,
    font,
    [
      {
        text: '1) Saberes pendientes de aprobación al inicio del ciclo lectivo deben transcribirse del RITE del ciclo lectivo anterior.',
      },
      {
        text: '2) En cada periodo se deberá indicar la situación de la/el estudiante: Aprobó y Acreditó (AA), Continúa, Con Avances (CCA), Continúa, Sin Avances (CSA).',
      },
      {
        text: '3) Para las materias aprobadas y acreditadas deberá completarse la calificación final (entre 4 y 10) al finalizar el periodo de intensificación en que ello ocurrió. Los siguientes períodos no deben ser completados.',
      },
    ],
    10.6,
    mpaaNotesY + 4.4,
    138,
    secondPageNotes
  )
  drawNotesColumn(
    pdf,
    font,
    [
      {
        text: '4) Si la materia no fue aprobada y acreditada durante el ciclo lectivo, al cierre del mismo deberá completarse la calificación final (1 a 3) y describir los saberes pendientes de aprobación.',
      },
    ],
    150.6,
    mpaaNotesY + 4.4,
    138,
    secondPageNotes
  )

  // ---------- Página 2: días hábiles e inasistencias ----------
  const bottomY = Math.max(134, leftNotesEnd + 8)
  const attendance = doc.attendance

  pdf.setFont(font, 'bold')
  pdf.setFontSize(7)
  pdf.setTextColor(0)
  pdf.text('DÍAS HÁBILES', 10.1, bottomY - 2.5)

  autoTable(pdf, {
    startY: bottomY,
    margin: { left: MARGIN_LEFT },
    tableWidth: ATTENDANCE_COLUMNS.reduce((total, width) => total + width, 0),
    theme: 'grid',
    styles: { ...baseStyles, fontSize: 8, cellPadding: 1, fillColor: ROW_LIGHT },
    headStyles: { ...headStyles, fontSize: 8.8, minCellHeight: 7.5 },
    head: [['', '1º CUATRIMESTRE', '2º CUATRIMESTRE', 'TOTAL']],
    body: [
      // En el formulario oficial, la primera fila (días hábiles) no lleva título.
      [
        { content: '', styles: { fillColor: ROW_DARK, minCellHeight: 11 } },
        attendance.term1.schoolDays,
        show(attendance.term2?.schoolDays),
        attendance.totalSchoolDays,
      ],
      [
        {
          content: 'INASISTENCIAS',
          styles: { fillColor: ROW_DARK, fontStyle: 'bold', fontSize: 6.8, minCellHeight: 13 },
        },
        formatAbsences(attendance.term1.absences),
        attendance.term2 ? formatAbsences(attendance.term2.absences) : '',
        formatAbsences(attendance.totalAbsences),
      ],
    ],
    columnStyles: toColumnStyles(ATTENDANCE_COLUMNS),
  })

  // ---------- Página 2: notificaciones ----------
  // Cada RITE firmado completa su columna en la tabla.
  const firstSigned = doc.notifications.find((item) => item.term === 'FIRST' && item.status === 'SIGNED')
  const secondSigned = doc.notifications.find((item) => item.term === 'SECOND' && item.status === 'SIGNED')

  autoTable(pdf, {
    startY: bottomY,
    margin: { left: 128.5 },
    tableWidth: NOTIFICATION_COLUMNS.reduce((total, width) => total + width, 0),
    theme: 'grid',
    styles: { ...baseStyles, fontSize: 7, cellPadding: 0.8, fillColor: ROW_LIGHT },
    headStyles: { ...headStyles, fontSize: 7, minCellHeight: 9 },
    head: [
      [
        { content: 'NOTIFICACIONES', colSpan: 2, styles: { fontSize: 8.8 } },
        '1º VALORACIÓN\nPRELIMINAR',
        'CALIFICACIÓN\n1º CUATRIMESTRE',
        '2º VALORACIÓN\nPRELIMINAR',
        'CALIFICACIÓN\n2º CUATRIMESTRE',
        'CALIFICACIÓN\nFINAL',
      ],
    ],
    body: [
      [
        { content: 'FECHA', colSpan: 2, styles: { ...labelStyles, fontSize: 8.8, minCellHeight: 7 } },
        '',
        formatDate(firstSigned?.signedAt),
        '',
        formatDate(secondSigned?.signedAt),
        '',
      ],
      [
        { content: 'FIRMA\nDE', rowSpan: 3, styles: labelStyles },
        { content: 'DIRECTORA/OR', styles: { ...labelStyles, fontSize: 8.8, minCellHeight: 9 } },
        '',
        firstSigned?.signedBy ?? '',
        '',
        secondSigned?.signedBy ?? '',
        '',
      ],
      [
        {
          content: 'ADULTA/O\nRESPONSABLE',
          styles: { ...labelStyles, fontSize: 8.8, minCellHeight: 12 },
        },
        '',
        '',
        '',
        '',
        '',
      ],
      [
        { content: 'ESTUDIANTE', styles: { ...labelStyles, fontSize: 8.8, minCellHeight: 10 } },
        '',
        '',
        '',
        '',
        '',
      ],
    ],
    columnStyles: toColumnStyles(NOTIFICATION_COLUMNS),
  })

  // ---------- Página 2: logos del pie ----------
  const footerWidth = 60
  const footerHeight = (footerLogo.naturalHeight / footerLogo.naturalWidth) * footerWidth
  addImageByWidth(pdf, footerLogo, 288.5 - footerWidth, 202 - footerHeight, footerWidth)

  const termCode = doc.term === 'FIRST' ? '1C' : '2C'
  pdf.save(`RITE_${doc.student.lastName}_${doc.student.firstName}_${doc.academicYear}_${termCode}.pdf`)
}