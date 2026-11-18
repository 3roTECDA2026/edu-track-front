import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  downloadInterventionTimelinePdf,
  listStudentInterventions,
  type InterventionFilters,
} from '@/services/interventions.service'

afterEach(() => {
  vi.unstubAllGlobals()
})

// Parámetros de una URL, sin el limit (que el PDF no usa)
const filterParams = (url: string) => {
  const params = new URL(url).searchParams
  params.delete('limit')
  return params.toString()
}

describe('el listado y el PDF usan los mismos filtros (CRM-088)', () => {
  it('mandan al back exactamente los mismos parámetros', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ data: { data: [], page: 1, limit: 100, total: 0, totalPages: 0 } }),
      blob: async () => new Blob(['%PDF-1.7']),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const filters: InterventionFilters = {
      eventType: 'HEALTH',
      from: '2026-03-01',
      to: '2026-11-13',
    }
    await listStudentInterventions('s1', filters)
    await downloadInterventionTimelinePdf('s1', filters)

    const [listUrl, pdfUrl] = fetchMock.mock.calls.map((call) => String((call as unknown[])[0]))
    expect(listUrl).toContain('/api/interventions?')
    expect(pdfUrl).toContain('/api/interventions/export/pdf?')
    expect(filterParams(pdfUrl)).toBe(filterParams(listUrl))
    expect(filterParams(listUrl)).toBe(
      'studentId=s1&eventType=HEALTH&from=2026-03-01&to=2026-11-13'
    )
  })
})
