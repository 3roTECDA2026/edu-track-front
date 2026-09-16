import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'
import AttendanceRow from './AttendanceRow'

type Alumno = {
  legajo: string
  apellido: string
  nombre: string
}

type Props = {
  alumnos: Alumno[]
  asistencia: Record<string, string>
  setAsistencia: (a: Record<string, string>) => void
}

export default function AttendanceGrid({ alumnos, asistencia, setAsistencia }: Props) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Legajo</TableCell>
            <TableCell>Apellido</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Asistencia</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {alumnos.map((alumno) => (
            <AttendanceRow
              key={alumno.legajo}
              alumno={alumno}
              estado={asistencia[alumno.legajo] ?? ''}
              setEstado={(valor) =>
                setAsistencia({ ...asistencia, [alumno.legajo]: valor })
              }
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}