import GroupAddOutlined from '@mui/icons-material/GroupAddOutlined'
import NoteAddOutlined from '@mui/icons-material/NoteAddOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  IconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material'

import { PateStatusChip } from '@/components/edteReferrals/PateStatusChip'
import {
  CREATE_PATE_PATH,
  CREATE_PATE_UNAVAILABLE,
} from '@/components/edteReferrals/referralLabels'
import type { ReferralRow } from '@/components/edteReferrals/referralRows'
import { SHIFT_LABELS } from '@/components/students/studentLabels'

const COLUMNS = [
  { label: 'Alumno', align: 'left' },
  { label: 'DNI', align: 'left' },
  // El curso es el del ciclo que se cerró, el que motivó la derivación (CRM-073)
  { label: 'Curso', align: 'left' },
  { label: 'MPAA', align: 'center' },
  { label: 'PATE', align: 'left' },
  { label: 'Acciones', align: 'right' },
] as const

const SKELETON_ROWS = 6

interface EdteReferralsTableProps {
  rows: ReferralRow[]
  loading: boolean
  pateUnavailable: boolean // No se sabe el estado del PATE: no se resalta ni se ofrece crearlo
  closedYear?: number // Ciclo que se cerró: aclara de qué año es el curso ("Curso en 2025")
  onViewProfile: (row: ReferralRow) => void
  onCreatePate: (row: ReferralRow) => void
  onAddToMeeting: (row: ReferralRow) => void
}

const sectionText = (row: ReferralRow) =>
  row.section
    ? `${row.section.grade}° ${row.section.division} · ${SHIFT_LABELS[row.section.shift]}`
    : 'Sin curso'

// Listado de derivados al EDTE (CRM-074, criterios 1, 3 y 4)
export function EdteReferralsTable({
  rows,
  loading,
  pateUnavailable,
  closedYear,
  onViewProfile,
  onCreatePate,
  onAddToMeeting,
}: EdteReferralsTableProps) {
  const columnLabel = (label: string) =>
    label === 'Curso' && closedYear !== undefined ? `Curso en ${closedYear}` : label
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 820 }}>
        <TableHead sx={{ backgroundColor: '#fafafa' }}>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableCell key={column.label} align={column.align} sx={{ whiteSpace: 'nowrap' }}>
                {columnLabel(column.label)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {loading
            ? Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                <TableRow key={index}>
                  {COLUMNS.map((column) => (
                    <TableCell key={column.label}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.map((row) => {
                const withoutPate = !pateUnavailable && row.pate === null
                const name = `${row.lastName}, ${row.firstName}`
                return (
                  <TableRow
                    key={row.studentId}
                    hover
                    data-without-pate={withoutPate || undefined}
                    sx={withoutPate ? { backgroundColor: 'background.default' } : undefined}
                  >
                    <TableCell sx={{ fontWeight: withoutPate ? 700 : 500 }}>{name}</TableCell>
                    <TableCell>{row.dni}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{sectionText(row)}</TableCell>
                    <TableCell align="center">{row.pendingCount}</TableCell>
                    <TableCell>
                      <PateStatusChip
                        state={pateUnavailable ? null : (row.pate?.status ?? 'NONE')}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Ver ficha">
                        <IconButton
                          size="small"
                          aria-label={`Ver ficha de ${name}`}
                          onClick={() => onViewProfile(row)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {row.pate === null && !pateUnavailable && (
                        <Tooltip title={CREATE_PATE_PATH ? 'Crear PATE' : CREATE_PATE_UNAVAILABLE}>
                          {/* El span permite que el tooltip funcione con el botón deshabilitado */}
                          <span>
                            <IconButton
                              size="small"
                              aria-label={`Crear PATE de ${name}`}
                              disabled={!CREATE_PATE_PATH}
                              onClick={() => onCreatePate(row)}
                            >
                              <NoteAddOutlined fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}

                      <Tooltip title="Agregar a reunión">
                        <IconButton
                          size="small"
                          aria-label={`Agregar a ${name} a una reunión`}
                          onClick={() => onAddToMeeting(row)}
                        >
                          <GroupAddOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
