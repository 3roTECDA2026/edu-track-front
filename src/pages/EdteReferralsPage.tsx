import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'

import { ContentCard } from '@/components/common/ContentCard'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { StandardTablePagination } from '@/components/common/StandardTablePagination'
import { AddToMeetingDialog } from '@/components/edteReferrals/AddToMeetingDialog'
import { EdteReferralsFilters } from '@/components/edteReferrals/EdteReferralsFilters'
import { EdteReferralsTable } from '@/components/edteReferrals/EdteReferralsTable'
import { editMeetingPath, newMeetingPath } from '@/components/edteReferrals/meetingLinks'
import { CREATE_PATE_PATH } from '@/components/edteReferrals/referralLabels'
import {
  EMPTY_FILTERS,
  countWithoutPate,
  filterOptions,
  filterReferralRows,
  type ReferralFilters,
  type ReferralRow,
} from '@/components/edteReferrals/referralRows'
import MainLayout from '@/components/layout/MainLayout'
import { useEdteReferrals } from '@/hooks/useEdteReferrals'

// Provisorio: en develop no hay un endpoint montado que diga cuál es el ciclo activo, así que se
// parte del año actual y se puede elegir otro (ver CRM-074-plan, sección 9)
const THIS_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2]

// Alumnos derivados al EDTE (E4-RF-02, CRM-074): listado para trabajar en las reuniones, con el
// estado de su PATE y los que todavía no lo tienen resaltados.
export const EdteReferralsPage = () => {
  const navigate = useNavigate()
  const [pateYear, setPateYear] = useState(THIS_YEAR)
  const [filters, setFilters] = useState<ReferralFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [meetingStudent, setMeetingStudent] = useState<ReferralRow | null>(null)

  const { rows, loading, error, forbidden, pateUnavailable, reload } = useEdteReferrals(pateYear)

  const options = useMemo(() => filterOptions(rows), [rows])
  const filtered = useMemo(() => filterReferralRows(rows, filters), [rows, filters])
  const pageRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const withoutPate = countWithoutPate(rows)

  const changeFilters = (changes: Partial<ReferralFilters>) => {
    setFilters((prev) => ({ ...prev, ...changes }))
    setPage(0)
  }

  const changeYear = (year: number) => {
    setPateYear(year)
    setFilters(EMPTY_FILTERS)
    setPage(0)
  }

  const closedYear = pateYear - 1

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Derivados al EDTE"
          subtitle={`Derivados al cierre de ${closedYear} · PATE del ciclo ${pateYear}`}
          breadcrumbs={[{ label: 'Inicio', href: '/home' }, { label: 'Derivados al EDTE' }]}
          action={
            <TextField
              select
              size="small"
              label="Ciclo del PATE"
              value={pateYear}
              onChange={(event) => changeYear(Number(event.target.value))}
              sx={{ minWidth: 160 }}
            >
              {YEAR_OPTIONS.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
          }
        />

        {forbidden ? (
          <Alert severity="warning">No tenés acceso al listado de derivados al EDTE.</Alert>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={reload}>
                Reintentar
              </Button>
            }
          >
            No se pudo cargar el listado de derivados. {error}
          </Alert>
        ) : (
          <Stack spacing={2}>
            {pateUnavailable && (
              <Alert severity="warning">
                No se pudo consultar el estado de los PATE: el listado se muestra sin esa columna.
              </Alert>
            )}

            <ContentCard>
              <EdteReferralsFilters
                filters={filters}
                options={options}
                onChange={changeFilters}
                onClear={() => changeFilters(EMPTY_FILTERS)}
              />

              {!loading && rows.length > 0 && !pateUnavailable && (
                <Typography variant="body2" sx={{ px: 2, pb: 1, color: 'text.secondary' }}>
                  <strong>
                    {withoutPate} de {rows.length}
                  </strong>{' '}
                  sin PATE
                </Typography>
              )}

              {!loading && rows.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No hay alumnos derivados al cierre de {closedYear}.
                  </Typography>
                </Box>
              ) : !loading && filtered.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Ningún derivado coincide con los filtros.
                  </Typography>
                </Box>
              ) : (
                <>
                  <EdteReferralsTable
                    rows={pageRows}
                    loading={loading}
                    pateUnavailable={pateUnavailable}
                    onViewProfile={(row) => navigate(`/students/${row.studentId}`)}
                    onCreatePate={(row) =>
                      CREATE_PATE_PATH && navigate(CREATE_PATE_PATH(row.studentId))
                    }
                    onAddToMeeting={setMeetingStudent}
                  />
                  {!loading && (
                    <StandardTablePagination
                      count={filtered.length}
                      page={page}
                      rowsPerPage={rowsPerPage}
                      onPageChange={setPage}
                      onRowsPerPageChange={(value) => {
                        setRowsPerPage(value)
                        setPage(0)
                      }}
                      itemLabel="alumnos"
                    />
                  )}
                </>
              )}
            </ContentCard>
          </Stack>
        )}

        {meetingStudent && (
          <AddToMeetingDialog
            student={meetingStudent}
            year={pateYear}
            onClose={() => setMeetingStudent(null)}
            onChooseMeeting={(meetingId) =>
              navigate(editMeetingPath(meetingId, meetingStudent.studentId))
            }
            onNewMeeting={() => navigate(newMeetingPath(meetingStudent.studentId))}
          />
        )}
      </PageContainer>
    </MainLayout>
  )
}

export default EdteReferralsPage
