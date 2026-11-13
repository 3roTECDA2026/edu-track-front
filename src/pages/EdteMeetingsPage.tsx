import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material'

import MainLayout from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { AddButton } from '@/components/common/AddButton'
import { StandardTablePagination } from '@/components/common/StandardTablePagination'
import { SoftBadge } from '@/components/studentProfile/SoftBadge'
import { SHIFT_LABELS } from '@/components/students/studentLabels'
import {
  EDTE_MANAGER_ROLES,
  MEETING_PERIOD_LABELS,
  MEETING_STATUS_CONFIG,
  formatMeetingDate,
} from '@/components/edte/edteLabels'
import { useEdteMeetings } from '@/hooks/useEdteMeetings'
import type { EdteMeetingPeriod } from '@/services/edteMeeting.service'
import { currentUser } from '@/utils/currentUser'

const PERIOD_FILTER_OPTIONS: { value: EdteMeetingPeriod | ''; label: string }[] = [
  { value: '', label: 'Todos los períodos' },
  ...(Object.keys(MEETING_PERIOD_LABELS) as EdteMeetingPeriod[]).map((value) => ({
    value,
    label: MEETING_PERIOD_LABELS[value],
  })),
]

const COLUMNS = ['Fecha', 'Período', 'Turno', 'Estado', 'Presentes', 'Alumnos tratados']

// Reuniones del EDTE (E4-RF-03, CRM-075): listado con filtro por ciclo lectivo y período
export const EdteMeetingsPage = () => {
  const navigate = useNavigate()
  const thisYear = new Date().getFullYear()
  const yearOptions = [thisYear - 1, thisYear, thisYear + 1]
  const canManage = EDTE_MANAGER_ROLES.includes(currentUser().role ?? '')

  const [year, setYear] = useState(thisYear)
  const [period, setPeriod] = useState<EdteMeetingPeriod | ''>('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { data, loading, error, reload } = useEdteMeetings({
    year,
    period: period || undefined,
  })
  const meetings = data ?? []
  const pageRows = meetings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const changeYear = (value: number) => {
    setYear(value)
    setPage(0)
  }
  const changePeriod = (value: EdteMeetingPeriod | '') => {
    setPeriod(value)
    setPage(0)
  }

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Reuniones del EDTE"
          subtitle="Registro de las reuniones del Equipo de Definición de Trayectorias Educativas."
          breadcrumbs={[{ label: 'Inicio', href: '/home' }, { label: 'Reuniones del EDTE' }]}
          action={
            canManage ? (
              <AddButton label="Nueva reunión" onClick={() => navigate('/edte-meetings/new')} />
            ) : undefined
          }
        />

        <ContentCard>
          {/* Filtros */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              p: 2,
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <TextField
              select
              size="small"
              label="Ciclo lectivo"
              value={year}
              onChange={(event) => changeYear(Number(event.target.value))}
              sx={{ minWidth: 160 }}
            >
              {yearOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Período"
              value={period}
              onChange={(event) => changePeriod(event.target.value as EdteMeetingPeriod | '')}
              sx={{ minWidth: 200 }}
            >
              {PERIOD_FILTER_OPTIONS.map((option) => (
                <MenuItem key={option.value || 'all'} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {error ? (
            <Box sx={{ p: 3 }}>
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={reload}>
                    Reintentar
                  </Button>
                }
              >
                No se pudieron cargar las reuniones. {error}
              </Alert>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small" sx={{ minWidth: 700 }}>
                  <TableHead sx={{ backgroundColor: '#fafafa' }}>
                    <TableRow>
                      {COLUMNS.map((column) => (
                        <TableCell
                          key={column}
                          align={
                            column === 'Presentes' || column === 'Alumnos tratados'
                              ? 'center'
                              : 'left'
                          }
                        >
                          {column}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={COLUMNS.length} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={28} />
                        </TableCell>
                      </TableRow>
                    ) : meetings.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={COLUMNS.length}
                          align="center"
                          sx={{ py: 4, color: 'text.secondary' }}
                        >
                          No hay reuniones registradas para estos filtros.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageRows.map((meeting) => {
                        const status = MEETING_STATUS_CONFIG[meeting.status]
                        return (
                          <TableRow
                            key={meeting.id}
                            hover
                            onClick={() => navigate(`/edte-meetings/${meeting.id}`)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {formatMeetingDate(meeting.date)}
                            </TableCell>
                            <TableCell>{MEETING_PERIOD_LABELS[meeting.period]}</TableCell>
                            <TableCell>
                              {meeting.shift ? SHIFT_LABELS[meeting.shift] : '—'}
                            </TableCell>
                            <TableCell>
                              <SoftBadge
                                label={status.label}
                                color={status.color}
                                background={status.background}
                              />
                            </TableCell>
                            <TableCell align="center">
                              {meeting.presentCount} de {meeting.membersCount}
                            </TableCell>
                            <TableCell align="center">{meeting.studentsCount}</TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <StandardTablePagination
                count={meetings.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={(rows) => {
                  setRowsPerPage(rows)
                  setPage(0)
                }}
                itemLabel="reuniones"
              />
            </>
          )}
        </ContentCard>
      </PageContainer>
    </MainLayout>
  )
}

export default EdteMeetingsPage
