import { TableRow, TableCell, Button } from '@mui/material'

type Alumno = {
  legajo: string
  apellido: string
  nombre: string
}

type Props = {
  alumno: Alumno
  estado: string
  setEstado: (valor: string) => void
  isFocused: boolean
  onClick: () => void
}

const ESTADOS = [
  { valor: 'Presente',     color: 'success' },
  { valor: 'Ausente',      color: 'error' },
  { valor: 'Media falta',  color: 'warning' },
  { valor: 'Cuarto falta', color: 'orange' },
] as const

export default function AttendanceRow({ alumno, estado, setEstado, isFocused, onClick }: Props) {
  return (
    <TableRow
      onClick={onClick}
      sx={{
        backgroundColor: isFocused ? '#e3f2fd' : 'transparent',
        cursor: 'pointer',
      }}
    >
      <TableCell>{alumno.legajo}</TableCell>
      <TableCell>{alumno.apellido}</TableCell>
      <TableCell>{alumno.nombre}</TableCell>
      <TableCell>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {ESTADOS.map((e) => (
            <Button
              key={e.valor}
              variant={estado === e.valor ? 'contained' : 'outlined'}
              color={e.color === 'orange' ? 'warning' : e.color}
              size="small"
              onClick={() => setEstado(e.valor)}
              sx={e.color === 'orange' ? {
                borderColor: '#f97316',
                color: estado === e.valor ? 'white' : '#f97316',
                backgroundColor: estado === e.valor ? '#f97316' : 'transparent',
              } : {}}
            >
              {e.valor}
            </Button>
          ))}
        </div>
      </TableCell>
    </TableRow>
  )
}