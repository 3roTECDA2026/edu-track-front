import { useState, useEffect, useRef } from 'react'
import SectionSelector from '../components/attendance/SectionSelector'
import AttendanceGrid from '../components/attendance/AttendanceGrid'
import { Box, Button, Typography } from '@mui/material'
import { postAttendanceBatch, EstadoAsistencia } from '../services/AttendanceService'

// TODO: reemplazar con llamada al backend GET /students?section=X
const STUDENTS_MOCK = [
  { legajo: '101', apellido: 'García', nombre: 'Lucas' },
  { legajo: '102', apellido: 'Martínez', nombre: 'Sofía' },
  { legajo: '103', apellido: 'López', nombre: 'Tomás' },
]

  type SaveStatus = 'unsaved' | 'saving' | 'saved'

export default function AttendancePage() {
  const [date, setDate] = useState(() => {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0]  // formato YYYY-MM-DD
  })
  const [section, setSection] = useState('')
  // TODO: reemplazar con const [students, setstudents] = useState([])
  const [students] = useState(STUDENTS_MOCK) // se elimina momentaneamente Setstudents y el useState inicializa con STUDENTS_MOCK en lugar de un array vacío
  const [attendance, setAttendance] = useState({})
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('unsaved')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(0)

  useEffect(() => {
    if (Object.keys(attendance).length === 0) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      handleSave()
    }, 2000)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [attendance])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        const student = students[focusedIndex]
        if (student) setAttendance(prev => ({ ...prev, [student.legajo]: 'Presente' }))
      }
      if (e.key === 'a' || e.key === 'A') {
        const student = students[focusedIndex]
        if (student) setAttendance(prev => ({ ...prev, [student.legajo]: 'Ausente' }))
      }
      if (e.key === 'ArrowDown') {
        setFocusedIndex(prev => Math.min(prev + 1, students.length - 1))
      }
      if (e.key === 'ArrowUp') {
        setFocusedIndex(prev => Math.max(prev - 1, 0))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedIndex, students])

  const handleSave = async () => {
    setSaveStatus('saving')
    const records = students.map((student) => ({
      legajo: student.legajo,
      date,
      section,
      estado: attendance[student.legajo] as EstadoAsistencia,
    }))

    try {
      await postAttendanceBatch(records)
      setSaveStatus('saved')
      console.log('Saved successfully')
    } catch (error) {
      setSaveStatus('unsaved')
      console.error('Error saving:', error)
    }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" mb={2}>Carga de Asistencia</Typography>
      <SectionSelector
        date={date} setDate={setDate}
        section={section} setSection={setSection}
      />
      <AttendanceGrid
        students={students}
        attendance={attendance}
        focusedIndex={focusedIndex}
        setFocusedIndex={setFocusedIndex}
        setAttendance={(newAttendance) => {
          setAttendance(newAttendance)
          setSaveStatus('unsaved')
        }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
        <Button variant="contained" onClick={handleSave}>
          Guardar todo
        </Button>
        {saveStatus === 'unsaved' && (
          <Typography variant="body2" sx={{ border: '1px dashed gray', px: 1, borderRadius: 1 }}>
            Sin guardar
          </Typography>
        )}
        {saveStatus === 'saving' && (
          <Typography variant="body2" color="primary">
            Guardando...
          </Typography>
        )}
        {saveStatus === 'saved' && (
          <Typography variant="body2" color="success.main">
            ✓ Guardado
          </Typography>
        )}
      </Box>
    </Box>
  )
}

