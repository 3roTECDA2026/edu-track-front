// @vitest-environment jsdom
import { PDFDocument } from 'pdf-lib'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { RiteDocument, RitePendingSubject, RiteSubject } from '@/services/rite.service'
import templateDataUrl from '@/assets/rite/RITE_2025_orientada.pdf?inline'
import { downloadRitePdf } from '@/utils/ritePdf'

// La plantilla oficial, embebida como dato por Vite (?inline): así el test no usa APIs de Node
const templateBytes = () =>
  Uint8Array.from(atob(templateDataUrl.split(',')[1] ?? ''), (c) => c.charCodeAt(0))

// Genera el PDF del RITE sobre la plantilla oficial y lo devuelve ya cargado, para contar sus páginas
async function generate(doc: RiteDocument, status: 'DRAFT' | 'SIGNED') {
  let blob: Blob | null = null
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, arrayBuffer: async () => templateBytes().buffer }))
  )
  URL.createObjectURL = (value: Blob | MediaSource) => {
    blob = value as Blob
    return 'blob:test'
  }
  URL.revokeObjectURL = () => {}
  HTMLAnchorElement.prototype.click = () => {}

  await downloadRitePdf(doc, status)
  return PDFDocument.load(new Uint8Array(await (blob as unknown as Blob).arrayBuffer()))
}

const subject = (index: number, overrides: Partial<RiteSubject> = {}): RiteSubject => ({
  enrollmentId: `e${index}`,
  type: 'C',
  subjectName: `Materia ${index}`,
  gradeLevel: 3,
  term1: { preliminaryAssessment: 'TEA', score: 7, observations: null },
  term2: { preliminaryAssessment: 'TEA', score: 8, observations: null },
  intensification: { december: null, february: null },
  finalScore: 7.5,
  ...overrides,
})

const pending = (
  index: number,
  overrides: Partial<RitePendingSubject> = {}
): RitePendingSubject => ({
  subjectName: `Pendiente ${index}`,
  gradeLevel: 2,
  originYear: 2025,
  initialPendingKnowledge: 'Saberes iniciales',
  results: {
    MARCH: 'CSA',
    JULY: 'AA',
    AUGUST: null,
    DECEMBER_TERM_CLOSE: null,
    DECEMBER: null,
    FEBRUARY_MARCH: null,
  },
  finalScore: 6,
  closingPendingKnowledge: null,
  ...overrides,
})

const baseDoc = (overrides: Partial<RiteDocument> = {}): RiteDocument => ({
  institution: { name: 'Escuela Normal Secundaria', number: '10', district: 'Tandil' },
  academicYear: 2026,
  term: 'SECOND',
  isPostIntensification: true,
  student: { id: 's', firstName: 'Sofía', lastName: 'Pérez', dni: '45111222', recordNumber: '1' },
  section: { grade: 3, division: 'A', shift: 'MORNING' },
  subjects: [subject(1)],
  pendingSubjects: [],
  attendance: {
    term1: { schoolDays: 90, absences: 3 },
    term2: { schoolDays: 88, absences: 2 },
    totalSchoolDays: 178,
    totalAbsences: 5,
  },
  generalNotes: null,
  notifications: [],
  ...overrides,
})

afterEach(() => vi.unstubAllGlobals())

describe('PDF del RITE sobre la plantilla orientada', () => {
  it('RITE firmado antes de este cambio: sin tabla de MPAA y con diciembre y febrero como número', async () => {
    // Copia fija de un RITE firmado con el formato anterior: sin pendingSubjects ni
    // pendingSubjectsTotal, sin term1IntensificationScore, y la nota suelta en diciembre y febrero
    const legacy = baseDoc({
      isPostIntensification: undefined,
      subjects: [subject(1, { intensification: { december: 4, february: 6 } })],
      notifications: [
        {
          term: 'SECOND',
          status: 'SIGNED',
          signedAt: '2025-12-10T12:00:00Z',
          signedBy: 'Laura Gómez',
        },
      ],
    })
    delete (legacy as Partial<RiteDocument>).pendingSubjects
    const pdf = await generate(legacy, 'SIGNED')
    expect(pdf.getPageCount()).toBe(2)
  })

  it('mezcla de AA, CCA y CSA en diciembre y febrero', async () => {
    const subjects = [
      subject(1, {
        intensification: {
          december: { score: null, resultCode: 'CCA' },
          february: { score: 5, resultCode: 'AA' },
        },
      }),
      subject(2, {
        intensification: {
          december: { score: null, resultCode: 'CSA' },
          february: { score: null, resultCode: 'CSA' },
        },
      }),
      subject(3, {
        intensification: {
          december: { score: 6, resultCode: 'AA' },
          february: { score: null, resultCode: null },
        },
      }),
      subject(4, { term1IntensificationScore: 4, intensification: null }),
    ]
    const pdf = await generate(baseDoc({ subjects }), 'DRAFT')
    expect(pdf.getPageCount()).toBe(2)
  })

  it('MPAA con los seis períodos, AA a mitad de camino y saberes largos', async () => {
    const long =
      'Argumentación escrita, uso de conectores y conclusiones, producción de textos expositivos con coherencia y cohesión, y lectura crítica de fuentes'
    const pendingSubjects = [
      pending(1, {
        initialPendingKnowledge: long,
        closingPendingKnowledge: long,
        finalScore: 2,
        results: {
          MARCH: 'CCA',
          JULY: 'CCA',
          AUGUST: 'CSA',
          DECEMBER_TERM_CLOSE: 'CCA',
          DECEMBER: 'CSA',
          FEBRUARY_MARCH: 'CCA',
        },
      }),
      pending(2, { finalScore: null, initialPendingKnowledge: null }),
    ]
    const pdf = await generate(baseDoc({ pendingSubjects, pendingSubjectsTotal: 2 }), 'DRAFT')
    expect(pdf.getPageCount()).toBe(2)
  })

  it('más de 4 MPAA: imprime 4 filas y el aviso, sin romperse', async () => {
    const pendingSubjects = [1, 2, 3, 4].map((index) => pending(index))
    const pdf = await generate(baseDoc({ pendingSubjects, pendingSubjectsTotal: 6 }), 'DRAFT')
    expect(pdf.getPageCount()).toBe(2)
  })

  it('el back puede devolver más filas que las que entran: solo se imprimen 4', async () => {
    const pendingSubjects = [1, 2, 3, 4, 5, 6].map((index) => pending(index))
    const pdf = await generate(baseDoc({ pendingSubjects, pendingSubjectsTotal: 6 }), 'DRAFT')
    expect(pdf.getPageCount()).toBe(2)
  })

  it('13 materias: imprime 12 y el aviso', async () => {
    const subjects = Array.from({ length: 13 }, (_, index) => subject(index + 1))
    const pdf = await generate(baseDoc({ subjects }), 'DRAFT')
    expect(pdf.getPageCount()).toBe(2)
  })

  it('sin MPAA: la tabla queda en blanco', async () => {
    const pdf = await generate(baseDoc({ pendingSubjects: [], pendingSubjectsTotal: 0 }), 'DRAFT')
    expect(pdf.getPageCount()).toBe(2)
  })
})
