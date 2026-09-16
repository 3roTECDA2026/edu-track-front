import { useState } from 'react'
import SectionSelector from '../components/attendance/SectionSelector'
import AttendanceGrid from '../components/attendance/AttendanceGrid'
import { Box, Button, Typography } from '@mui/material'

export default function AttendancePage() {
  const [fecha, setFecha] = useState(() => {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0]  // formato YYYY-MM-DD
  })
  const [seccion, setSeccion] = useState('')
  const [alumnos, setAlumnos] = useState([])
  const [asistencia, setAsistencia] = useState({})

  const handleGuardar = () => {
    console.log({ fecha, seccion, asistencia })
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" mb={2}>Carga de Asistencia</Typography>
      <SectionSelector
        fecha={fecha} setFecha={setFecha}
        seccion={seccion} setSeccion={setSeccion}
      />
      <AttendanceGrid
        alumnos={alumnos}
        asistencia={asistencia}
        setAsistencia={setAsistencia}
      />
      <Button variant="contained" onClick={handleGuardar} sx={{ mt: 2 }}>
        Guardar todo
      </Button>
    </Box>
  )
}