import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'

import MainLayout from '@/components/layout/MainLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { AddButton } from '@/components/common/AddButton'
import { useInstitutionalConfig } from '@/hooks/useInstitutionalConfig'
import type { OrganizationalModel } from '@/services/institutionalConfig.service'

// Opciones del Anexo 5 (Cuadro 2). Las descripciones son provisorias.
const MODEL_OPTIONS: { value: OrganizationalModel; label: string; description: string }[] = [
  {
    value: 'OPTION_A',
    label: 'Opción A',
    description:
      'Modelos 1 y 2: misma disciplina del año siguiente y materia original en el turno de cursada.',
  },
  {
    value: 'OPTION_B',
    label: 'Opción B',
    description: 'Modelos 1 y 3: misma disciplina del año siguiente y misma materia a contraturno.',
  },
  {
    value: 'OPTION_C',
    label: 'Opción C',
    description: 'Modelos 1, 2 y 3: disciplina del año siguiente, materia original y contraturno.',
  },
  {
    value: 'OPTION_D',
    label: 'Opción D',
    description:
      'Modelos 1 y 4: disciplina del año siguiente y espacios de intensificación a contraturno o sábados (módulos FORTE).',
  },
]

// Solo estos roles pueden modificar el modelo (punto 4 del ticket). El back igual lo valida.
const EDIT_ROLES = ['ADMINISTRATOR', 'SCHOOL_MANAGEMENT']

function getCurrentUserRole(): string | null {
  try {
    const raw = sessionStorage.getItem('user') || localStorage.getItem('user')
    if (!raw) return null
    return (JSON.parse(raw) as { role?: string }).role ?? null
  } catch {
    return null
  }
}

export const OrganizationalModelPage = () => {
  const { config, loading, error, saving, save } = useInstitutionalConfig()

  const canEdit = useMemo(() => {
    const role = getCurrentUserRole()
    return role !== null && EDIT_ROLES.includes(role)
  }, [])

  const [selected, setSelected] = useState<OrganizationalModel | ''>('')
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // El modelo mostrado: el elegido localmente, o el ya guardado.
  const currentModel: OrganizationalModel | '' = selected || config?.organizationalModel || ''

  const handleSave = async () => {
    if (!currentModel) {
      setNotice({ type: 'error', text: 'Elegí una opción antes de guardar.' })
      return
    }
    const ok = await save({ organizationalModel: currentModel })
    setNotice(
      ok
        ? { type: 'success', text: 'Modelo organizativo guardado correctamente.' }
        : { type: 'error', text: 'No se pudo guardar. Intentá de nuevo.' }
    )
    if (ok) setSelected('')
  }

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1280, mx: 'auto', p: 1 }}>
        <PageHeader
          title="Modelo organizativo institucional"
          subtitle="Elegí la combinación de modelos de intensificación que adopta la escuela (Opciones A, B, C o D del Anexo 5). El modelo se sostiene por un mínimo de 3 ciclos lectivos."
          breadcrumbs={[
            { label: 'Inicio', href: '/' },
            { label: 'Configuración' },
            { label: 'Modelo organizativo' },
          ]}
        />

        <ContentCard>
          <Box sx={{ p: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : error ? (
              <Alert severity="error">No se pudo cargar la configuración: {error}</Alert>
            ) : (
              <>
                {/* Estado / alerta del plazo de 3 ciclos */}
                {config ? (
                  <Alert severity={config.minimumPeriodMet ? 'warning' : 'info'} sx={{ mb: 3 }}>
                    {config.minimumPeriodMet
                      ? 'Se cumplió el mínimo de 3 ciclos lectivos. Ya se puede cambiar el modelo.'
                      : `Rige desde el ciclo ${new Date(config.adoptedAt).getFullYear()} y debe sostenerse un mínimo de 3 ciclos lectivos; se podrá cambiar a partir del ciclo ${new Date(config.minimumExpiryDate).getFullYear()} (inciso 35, Anexo 5).`}
                  </Alert>
                ) : (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Todavía no se configuró el modelo organizativo de la escuela.
                  </Alert>
                )}

                {notice && (
                  <Alert severity={notice.type} onClose={() => setNotice(null)} sx={{ mb: 3 }}>
                    {notice.text}
                  </Alert>
                )}

                {/* Selector de modelo */}
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Modelo adoptado
                </Typography>
                <RadioGroup
                  value={currentModel}
                  onChange={(event) => {
                    setSelected(event.target.value as OrganizationalModel)
                    setNotice(null)
                  }}
                >
                  {MODEL_OPTIONS.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      disabled={!canEdit}
                      control={<Radio />}
                      sx={{ alignItems: 'flex-start', mb: 1 }}
                      label={
                        <Box sx={{ py: 0.5 }}>
                          <Typography sx={{ fontWeight: 600 }}>{option.label}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {option.description}
                          </Typography>
                        </Box>
                      }
                    />
                  ))}
                </RadioGroup>

                {/* Guardar: solo dirección / administración */}
                {canEdit ? (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <AddButton
                      label={saving ? 'Guardando…' : 'Guardar'}
                      icon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={saving}
                    />
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mt: 3 }}>
                    Solo dirección o administración pueden modificar el modelo organizativo.
                  </Alert>
                )}
              </>
            )}
          </Box>
        </ContentCard>
      </Box>
    </MainLayout>
  )
}

export default OrganizationalModelPage
