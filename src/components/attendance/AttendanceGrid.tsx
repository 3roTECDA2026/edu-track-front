import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'
import AttendanceRow from './AttendanceRow'

type Alumno = {
  legajo: string
  apellido: string
  nombre: string
}

type Props = {
  students: Alumno[]
  attendance: Record<string, string>
  setAttendance: (a: Record<string, string>) => void
  focusedIndex: number
  setFocusedIndex: (i: number) => void
}

export default function AttendanceGrid({ students, attendance, setAttendance, focusedIndex, setFocusedIndex }: Props) {
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
          {students.map((alumno, index) => (
            <AttendanceRow
              key={alumno.legajo}
              alumno={alumno}
              estado={attendance[alumno.legajo] ?? ''}
              isFocused={index === focusedIndex}
              onClick={() => setFocusedIndex(index)}
              setEstado={(valor) =>
                setAttendance({ ...attendance, [alumno.legajo]: valor })
              }
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}