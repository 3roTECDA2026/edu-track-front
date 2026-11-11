import { Box, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import PageHeader from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { getPate, type Pate } from '@/services/pate.service'

export default function PateDetailPage() {
  const { id } = useParams()
  const [pate, setPate] = useState<Pate | null>(null)
  useEffect(() => { if (id) getPate(id).then(setPate).catch(() => setPate(null)) }, [id])
  if (!pate) return <MainLayout><Box sx={{ p: 2 }}><Typography>Cargando...</Typography></Box></MainLayout>
  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 1 }}>
        <PageHeader title="Detalle PATE" subtitle={pate.student ? `${pate.student.lastName}, ${pate.student.firstName}` : pate.id} breadcrumbs={[{ label: 'Inicio', href: '/home' }, { label: 'PATE' }]} />
        <ContentCard>
          <Typography variant="subtitle2">Diagnóstico</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{pate.diagnosis}</Typography>
          <Typography variant="subtitle2">Estrategias</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{pate.supportStrategies}</Typography>
          <Typography variant="subtitle2">Cronograma</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{pate.schedule ?? '—'}</Typography>
          <Typography variant="subtitle2">Materias a intensificar</Typography>
          {(pate.subjectsToIntensify ?? []).map((s) => <Typography key={s.id} variant="body2">- {s.subjectName} (Modelo {s.model.replace('MODEL_', '')})</Typography>)}
          {(pate.subjectsToIntensify ?? []).length === 0 && <Typography variant="body2">Ninguna</Typography>}
          <Typography variant="subtitle2" sx={{ mt: 2 }}>Materias a recursar</Typography>
          {(pate.subjectsToRepeat ?? []).map((s) => <Typography key={s.id} variant="body2">- {s.subjectName}</Typography>)}
          {(pate.subjectsToRepeat ?? []).length === 0 && <Typography variant="body2">Ninguna</Typography>}
        </ContentCard>
      </Box>
    </MainLayout>
  )
}
