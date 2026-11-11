import { useState } from 'react'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { Alert, Box, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import MainLayout from '@/components/layout/MainLayout'
import PageHeader from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { fetchApi } from '@/services/api'

interface Decision {
  id: string
  studentId: string
  student?: { firstName?: string; lastName?: string }
  pendingCount: number
  outcome: 'PROMOTED' | 'REFERRED_TO_EDTE'
}

export default function PromotionPage() {
  const { academicYears, selectedYear } = useAcademicYears()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Decision[]>([])
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    if (!confirm('¿Ejecutar el motor de promoción?')) return
    const activeYear = academicYears.find((y) => y.active) ?? academicYears.find((y) => y.year === selectedYear)
    if (!activeYear) { setError('No hay ciclo activo'); return }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchApi<{ decisions: Decision[] }>('/api/promotion/run', {
        method: 'POST',
        body: JSON.stringify({ academicYearId: activeYear.id }),
      })
      setResults(data.decisions ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 1 }}>
        <PageHeader title="Motor de promoción" subtitle="Ejecutá el motor y revisá los resultados." breadcrumbs={[{ label: 'Inicio', href: '/home' }, { label: 'Promoción' }]} />
        <ContentCard sx={{ p: 2, mb: 2 }}>
          <Button variant="contained" onClick={run} disabled={loading || !academicYears.some((y) => y.active || y.year === selectedYear)}>
            {loading ? 'Ejecutando...' : 'Ejecutar motor de promoción'}
          </Button>
          {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        </ContentCard>
        <ContentCard>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Alumno</TableCell>
                <TableCell align="center">MPAA</TableCell>
                <TableCell>Resultado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{[r.student?.lastName, r.student?.firstName].filter(Boolean).join(', ') || r.studentId}</TableCell>
                  <TableCell align="center">{r.pendingCount}</TableCell>
                  <TableCell>{r.outcome === 'PROMOTED' ? 'Promueve' : 'Derivado al EDTE'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ContentCard>
      </Box>
    </MainLayout>
  )
}
