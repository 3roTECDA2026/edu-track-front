import { Box, Typography } from '@mui/material'

import { IndicatorCard } from '@/components/edteDashboard/IndicatorCard'
import { LEVEL_ICONS } from '@/components/edteDashboard/levelIcons'
import {
  LEVEL_CONFIG,
  NO_ASSESSMENT,
  earlyWarningHint,
  referredHint,
} from '@/components/edteDashboard/dashboardLabels'
import { ASSESSMENT_CONFIG } from '@/components/studentProfile/profileLabels'
import type { DashboardIndicators, DashboardThresholds } from '@/services/edteDashboard.service'

interface IndicatorCardsProps {
  indicators: DashboardIndicators | undefined
  thresholds: DashboardThresholds | undefined
  loading: boolean
}

const gridSx = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
} as const

// Tarjetas de indicadores del dashboard del EDTE (CRM-077, criterio 2), con los colores del
// semáforo. Se actualizan junto con el listado cuando cambian los filtros.
export const IndicatorCards = ({ indicators, thresholds, loading }: IndicatorCardsProps) => {
  const byAssessment = indicators?.studentsByAssessment
  const HighIcon = LEVEL_ICONS.HIGH
  const MediumIcon = LEVEL_ICONS.MEDIUM

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {/* Riesgo: derivados, alerta temprana y TED del período */}
      <Box sx={gridSx}>
        <IndicatorCard
          label="Derivados al EDTE"
          hint={thresholds && referredHint(thresholds)}
          value={indicators?.referred}
          loading={loading}
          icon={<HighIcon />}
          levelText={LEVEL_CONFIG.HIGH.text}
          color={LEVEL_CONFIG.HIGH.color}
          background={LEVEL_CONFIG.HIGH.background}
        />
        <IndicatorCard
          label="Alerta temprana"
          hint={thresholds && earlyWarningHint(thresholds)}
          value={indicators?.earlyWarning}
          loading={loading}
          icon={<MediumIcon />}
          levelText={LEVEL_CONFIG.MEDIUM.text}
          color={LEVEL_CONFIG.MEDIUM.color}
          background={LEVEL_CONFIG.MEDIUM.background}
        />
        <IndicatorCard
          label="TED en el período"
          hint="Materias con TED (no alumnos)"
          value={indicators?.tedAssessments}
          loading={loading}
          icon={<HighIcon />}
          levelText={LEVEL_CONFIG.HIGH.text}
          color={LEVEL_CONFIG.HIGH.color}
          background={LEVEL_CONFIG.HIGH.background}
        />
        <IndicatorCard
          label="Alumnos del ciclo"
          hint="Los que cumplen los filtros"
          value={indicators?.totalStudents}
          loading={loading}
          color="#111827"
          background="#ffffff"
        />
      </Box>

      {/* Alumnos por valoración: su peor valoración del cuatrimestre */}
      <Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1 }}>
          Alumnos por valoración (la peor de sus materias)
        </Typography>
        <Box sx={gridSx}>
          {(['TEA', 'TEP', 'TED'] as const).map((value) => (
            <IndicatorCard
              key={value}
              label={`${value} · ${ASSESSMENT_CONFIG[value].description}`}
              value={byAssessment?.[value]}
              loading={loading}
              color={ASSESSMENT_CONFIG[value].color}
              background={ASSESSMENT_CONFIG[value].background}
            />
          ))}
          <IndicatorCard
            label={NO_ASSESSMENT.label}
            value={byAssessment?.NONE}
            loading={loading}
            color={NO_ASSESSMENT.color}
            background={NO_ASSESSMENT.background}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default IndicatorCards
