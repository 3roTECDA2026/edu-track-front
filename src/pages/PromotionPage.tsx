import { useState } from 'react'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import MainLayout from '@/components/layout/MainLayout'
import PageHeader from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { fetchApi } from '@/services/api'

interface Decision {
  id: string
  studentId: string
  student?: { firstName?: string; lastName?: string }
  studentName?: string
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
    const userRaw = (typeof window !== 'undefined' ? (sessionStorage.getItem('user') || localStorage.getItem('user')) : null)
    const user = userRaw ? JSON.parse(userRaw) : null
    setLoading(true)
    setError(null)
    try {
      const data = await fetchApi<{ decisions: Decision[] }>('/api/promotion/run', {
        method: 'POST',
        body: JSON.stringify({ academicYearId: activeYear?.id ?? '', executedById: user?.id ?? '' }),
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
          <Button variant="contained" onClick={run} disabled={loading}>
            {loading ? 'Ejecutando...' : 'Ejecutar motor de promoción'}
          </Button>
          {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
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
                  <TableCell>{r.studentName ?? ([r.student?.firstName, r.student?.lastName].filter(Boolean).join(' ') || r.studentId)}</TableCell>
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
