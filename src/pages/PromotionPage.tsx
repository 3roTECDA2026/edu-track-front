import { useState, useMemo } from 'react'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
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
  const { academicYears, loading: yearsLoading, error: yearsError } = useAcademicYears()
  const [selectedCycleId, setSelectedCycleId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Decision[]>([])
  const [error, setError] = useState<string | null>(null)

  // Filtramos ciclos lectivos cerrados (requisito del motor de promoción CRM-062)
  const closedYears = useMemo(() => {
    return academicYears.filter((y) => Boolean(y.closedAt))
  }, [academicYears])

  // Por defecto se toma el último ciclo cerrado disponible, o el primero
  const targetYearId = selectedCycleId || closedYears[0]?.id || ''

  const run = async () => {
    if (!targetYearId) {
      setError('Debe seleccionar un ciclo lectivo cerrado para ejecutar la promoción')
      return
    }

    const selectedCycle = academicYears.find((y) => y.id === targetYearId)
    const yearLabel = selectedCycle ? String(selectedCycle.year) : ''

    if (!confirm(`¿Ejecutar el motor de promoción para el ciclo lectivo ${yearLabel}?`)) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await fetchApi<{ decisions: Decision[] }>('/api/promotion/run', {
        method: 'POST',
        body: JSON.stringify({ academicYearId: targetYearId }),
      })
      setResults(data.decisions ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al ejecutar el motor de promoción')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 1 }}>
        <PageHeader
          title="Motor de promoción"
          subtitle="Ejecutá el cálculo de promoción y derivación al EDTE para ciclos lectivos cerrados."
          breadcrumbs={[{ label: 'Inicio', href: '/home' }, { label: 'Promoción' }]}
        />

        {yearsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {yearsError}
          </Alert>
        )}

        <ContentCard sx={{ p: 2, mb: 2 }}>
          {yearsLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Cargando ciclos lectivos...
              </Typography>
            </Box>
          ) : closedYears.length === 0 ? (
            <Alert severity="warning">
              No hay ciclos lectivos cerrados disponibles. El motor de promoción solo puede
              ejecutarse sobre ciclos lectivos cerrados.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="select-closed-year-label">Ciclo lectivo cerrado</InputLabel>
                <Select
                  labelId="select-closed-year-label"
                  label="Ciclo lectivo cerrado"
                  value={targetYearId}
                  onChange={(e) => setSelectedCycleId(e.target.value)}
                  disabled={loading}
                >
                  {closedYears.map((y) => (
                    <MenuItem key={y.id} value={y.id}>
                      {y.year} {y.active ? '(Activo)' : ''} (Cerrado)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button variant="contained" onClick={run} disabled={loading || !targetYearId}>
                {loading ? 'Ejecutando...' : 'Ejecutar motor de promoción'}
              </Button>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </ContentCard>

        {results.length > 0 && (
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
                    <TableCell>
                      {[r.student?.lastName, r.student?.firstName].filter(Boolean).join(', ') ||
                        r.studentId}
                    </TableCell>
                    <TableCell align="center">{r.pendingCount}</TableCell>
                    <TableCell>
                      {r.outcome === 'PROMOTED' ? 'Promueve' : 'Derivado al EDTE'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ContentCard>
        )}
      </Box>
    </MainLayout>
  )
}
