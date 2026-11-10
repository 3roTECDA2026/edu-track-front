import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import { LEVEL_CONFIG, pateStatusLabel } from '@/components/edteDashboard/dashboardLabels'
import { StandardTablePagination } from '@/components/common/StandardTablePagination'
import { SHIFT_LABELS } from '@/components/students/studentLabels'
import { SoftBadge } from '@/components/studentProfile/SoftBadge'
import { ASSESSMENT_CONFIG } from '@/components/studentProfile/profileLabels'
import type { DashboardStudent } from '@/services/edteDashboard.service'

interface ComplexTrajectoriesTableProps {
  students: DashboardStudent[] | undefined
  loading: boolean
}

const COLUMNS = ['Riesgo', 'Alumno', 'Curso', 'Valoración', 'TED', 'MPAA', 'PATE', 'Acciones']
const CENTERED = ['TED', 'MPAA']

// Listado de alumnos con trayectorias complejas (CRM-077, criterio 4): 4 o más materias
// pendientes, alguna TED en el cuatrimestre o PATE en curso. Ordenado de rojo a verde.
export const ComplexTrajectoriesTable = ({ students, loading }: ComplexTrajectoriesTableProps) => {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const rows = students ?? []
  // Si los filtros dejan menos filas, la página elegida podría quedar fuera de rango
  const lastPage = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1)
  const currentPage = Math.min(page, lastPage)
  const pageRows = rows.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage)

  return (
    <>
      <Box sx={{ px: 3, pt: 3, pb: 1.5 }}>
        <Typography variant="h6">Alumnos con trayectorias complejas</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          4 o más materias pendientes, alguna materia con TED en el período o PATE en curso.
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small" sx={{ minWidth: 900 }}>
          <TableHead sx={{ backgroundColor: '#fafafa' }}>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableCell
                  key={column}
                  align={
                    CENTERED.includes(column) ? 'center' : column === 'Acciones' ? 'right' : 'left'
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
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length}
                  align="center"
                  sx={{ py: 4, color: 'text.secondary' }}
                >
                  No hay alumnos con trayectorias complejas para estos filtros.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((student) => {
                const level = LEVEL_CONFIG[student.level]
                const assessment = student.assessment ? ASSESSMENT_CONFIG[student.assessment] : null
                return (
                  <TableRow key={student.id} hover>
                    <TableCell>
                      <SoftBadge
                        label={level.label}
                        color={level.color}
                        background={level.background}
                        title={level.description}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {student.lastName}, {student.firstName}
                      <Typography
                        variant="caption"
                        sx={{ display: 'block', color: 'text.secondary', fontWeight: 400 }}
                      >
                        DNI {student.dni}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {student.section.grade}° {student.section.division} ·{' '}
                      {SHIFT_LABELS[student.section.shift]}
                    </TableCell>
                    <TableCell>
                      {student.assessment && assessment ? (
                        <SoftBadge
                          label={student.assessment}
                          color={assessment.color}
                          background={assessment.background}
                          title={assessment.description}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell align="center">{student.tedCount}</TableCell>
                    <TableCell align="center">{student.pendingSubjectsCount}</TableCell>
                    <TableCell>
                      {student.pate ? pateStatusLabel(student.pate.status) : 'Sin PATE'}
                    </TableCell>
                    <TableCell align="right">
                      {/* El PATE todavía no tiene pantalla propia (CRM-078): se ve desde la ficha */}
                      <Button
                        size="small"
                        color="inherit"
                        onClick={() => navigate(`/students/${student.id}`)}
                      >
                        {student.pate ? 'Ver ficha y PATE' : 'Ver ficha'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <StandardTablePagination
        count={rows.length}
        page={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value)
          setPage(0)
        }}
        itemLabel="alumnos"
      />
    </>
  )
}

export default ComplexTrajectoriesTable
