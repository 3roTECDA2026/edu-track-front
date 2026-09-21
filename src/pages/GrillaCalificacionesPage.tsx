// src/pages/GrillaCalificacionesPage.tsx
import React, { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import MainLayout from '../components/layout/MainLayout'
// Cuando existan los endpoints, descomentar para usar el servicio real:
// import { fetchApi } from '../services/api'

/*
  Pantalla 09 "Carga de calificaciones" (EduTrack / Aura) — ISFDyT Nº 166.

  Funciona con DATOS DE PRUEBA (mock). Los dropdowns (curso, materia) y la lista
  de alumnos saldrán de sus endpoints (cursos, materias, estudiantes) cuando existan.
  El guardado se conecta a POST /api/grades en el punto marcado "== ENCHUFE API ==".

  El modelo del back guarda tres notas por materia: 1° cuatrimestre (term1Score),
  2° cuatrimestre (term2Score) y nota final (finalScore); por eso hay 3 columnas.
*/

// ─────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────

type Modo = 'edicion' | 'consulta'
type Nivel = 'baja' | 'media' | 'alta' | 'vacia'
type Campo = 'term1Score' | 'term2Score' | 'finalScore'

interface Curso {
  id: string
  nombre: string
}
interface Materia {
  id: string
  courseId: string
  nombre: string
}
interface Alumno {
  id: string
  courseId: string
  apellido: string
  nombre: string
  dni: string
}

// Todas las notas en un mapa plano. Clave: studentId|subjectId|year|campo
type NotasMap = Record<string, number>

// Las tres columnas de notas, en orden
const COLUMNAS: { campo: Campo; label: string }[] = [
  { campo: 'term1Score', label: '1° Cuatri' },
  { campo: 'term2Score', label: '2° Cuatri' },
  { campo: 'finalScore', label: 'Final' },
]

// ─────────────────────────────────────────────────────────────
// DATOS DE PRUEBA (se reemplazan cuando existan los endpoints)
// ─────────────────────────────────────────────────────────────

const CURSOS: Curso[] = [
  { id: 'c1', nombre: '1° A' },
  { id: 'c2', nombre: '2° B' },
  { id: 'c3', nombre: '3° A' },
]

const MATERIAS: Materia[] = [
  { id: 'm1', courseId: 'c1', nombre: 'Matemática' },
  { id: 'm2', courseId: 'c1', nombre: 'Lengua y Literatura' },
  { id: 'm3', courseId: 'c1', nombre: 'Ciencias Naturales' },
  { id: 'm4', courseId: 'c2', nombre: 'Matemática' },
  { id: 'm5', courseId: 'c2', nombre: 'Historia' },
  { id: 'm6', courseId: 'c3', nombre: 'Prácticas del Lenguaje' },
  { id: 'm7', courseId: 'c3', nombre: 'Física' },
]

const ALUMNOS: Alumno[] = [
  { id: 'a1', courseId: 'c1', apellido: 'Acosta', nombre: 'María', dni: '48.111.222' },
  { id: 'a2', courseId: 'c1', apellido: 'Benítez', nombre: 'Juan', dni: '47.333.444' },
  { id: 'a3', courseId: 'c1', apellido: 'Coria', nombre: 'Lucía', dni: '48.555.666' },
  { id: 'a4', courseId: 'c1', apellido: 'Domínguez', nombre: 'Tomás', dni: '47.777.888' },
  { id: 'a5', courseId: 'c1', apellido: 'Fernández', nombre: 'Camila', dni: '48.999.000' },
  { id: 'a11', courseId: 'c1', apellido: 'García', nombre: 'Lautaro', dni: '48.222.333' },
  { id: 'a12', courseId: 'c1', apellido: 'Herrera', nombre: 'Sol', dni: '48.333.444' },
  { id: 'a13', courseId: 'c1', apellido: 'Ledesma', nombre: 'Iván', dni: '48.444.555' },
  { id: 'a14', courseId: 'c1', apellido: 'Molina', nombre: 'Abril', dni: '48.555.777' },
  { id: 'a15', courseId: 'c1', apellido: 'Nuñez', nombre: 'Thiago', dni: '48.666.888' },
  { id: 'a16', courseId: 'c1', apellido: 'Ortiz', nombre: 'Renata', dni: '48.777.999' },
  { id: 'a17', courseId: 'c1', apellido: 'Paredes', nombre: 'Benjamín', dni: '48.888.000' },
  { id: 'a18', courseId: 'c1', apellido: 'Quiroga', nombre: 'Delfina', dni: '48.999.111' },
  { id: 'a6', courseId: 'c2', apellido: 'Gómez', nombre: 'Sofía', dni: '46.123.456' },
  { id: 'a7', courseId: 'c2', apellido: 'Herrera', nombre: 'Mateo', dni: '46.234.567' },
  { id: 'a8', courseId: 'c2', apellido: 'Ibáñez', nombre: 'Valentina', dni: '46.345.678' },
  { id: 'a9', courseId: 'c3', apellido: 'Juárez', nombre: 'Bruno', dni: '45.456.789' },
  { id: 'a10', courseId: 'c3', apellido: 'López', nombre: 'Martina', dni: '45.567.890' },
]

const NOTAS_INICIALES: NotasMap = {
  'a1|m1|2026|term1Score': 8,
  'a1|m1|2026|term2Score': 7,
  'a1|m1|2026|finalScore': 8,
  'a2|m1|2026|term1Score': 4,
  'a2|m1|2026|term2Score': 6,
  'a3|m1|2026|term1Score': 3,
  'a4|m1|2026|term1Score': 10,
  'a4|m1|2026|term2Score': 9,
  'a4|m1|2026|finalScore': 10,
}

const ANIOS = [2025, 2026]

// Cuantos alumnos por pagina (con datos reales seria el pageSize del back)
const TAMANIO_PAGINA = 10

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const clave = (studentId: string, subjectId: string, year: number, campo: Campo) =>
  `${studentId}|${subjectId}|${year}|${campo}`

// Clasifica la nota para el resaltado: rojo (<4), amarillo (4-6), verde (>=7)
function nivelNota(valor: number | undefined): Nivel {
  if (valor === undefined) return 'vacia'
  if (valor < 4) return 'baja'
  if (valor <= 6) return 'media'
  return 'alta'
}

// Colores por nivel (semáforo)
const COLORES: Record<Nivel, { bg: string; fg: string; bd: string }> = {
  baja: { bg: '#fdecec', fg: '#b42318', bd: '#f0b4b4' },
  media: { bg: '#fdf6e3', fg: '#8a6a00', bd: '#eddca0' },
  alta: { bg: '#e9f7ee', fg: '#1a7f37', bd: '#a9e0bd' },
  vacia: { bg: 'transparent', fg: 'text.disabled', bd: 'divider' },
}

// ─────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────

export const GrillaCalificacionesPage: React.FC = () => {
  const [cursoId, setCursoId] = useState<string>('c1')
  const [materiaId, setMateriaId] = useState<string>('m1')
  const [anio, setAnio] = useState<number>(2026)
  const [modo, setModo] = useState<Modo>('edicion')
  const [pagina, setPagina] = useState<number>(1)

  const [notas, setNotas] = useState<NotasMap>(NOTAS_INICIALES)
  const [modificadas, setModificadas] = useState<Set<string>>(new Set())
  const [aviso, setAviso] = useState<{ tipo: 'success' | 'info'; texto: string } | null>(null)

  // Un arreglo de refs por columna, para que Enter baje dentro de la misma columna
  const inputsRef = useRef<Record<Campo, Array<HTMLInputElement | null>>>({
    term1Score: [],
    term2Score: [],
    finalScore: [],
  })

  const soloLectura = modo === 'consulta'

  const materiasDelCurso = useMemo(
    () => MATERIAS.filter((m) => m.courseId === cursoId),
    [cursoId],
  )

  const alumnosDelCurso = useMemo(
    () =>
      ALUMNOS.filter((a) => a.courseId === cursoId).sort((x, y) =>
        x.apellido.localeCompare(y.apellido, 'es'),
      ),
    [cursoId],
  )

  // Alumnos de la pagina actual (paginado del lado del front sobre el mock;
  // con datos reales, cada pagina se pediria al back con page/pageSize).
  const totalPaginas = Math.max(1, Math.ceil(alumnosDelCurso.length / TAMANIO_PAGINA))
  const alumnosPagina = alumnosDelCurso.slice(
    (pagina - 1) * TAMANIO_PAGINA,
    pagina * TAMANIO_PAGINA,
  )

  const leerNota = (studentId: string, campo: Campo): number | undefined =>
    notas[clave(studentId, materiaId, anio, campo)]

  function cambiarCurso(nuevoCurso: string) {
    setCursoId(nuevoCurso)
    const primera = MATERIAS.find((m) => m.courseId === nuevoCurso)
    setMateriaId(primera ? primera.id : '')
    setPagina(1)
    setAviso(null)
    // == ENCHUFE API == acá va un GET de calificaciones para el nuevo curso/materia
  }

  function editarNota(studentId: string, campo: Campo, textoCrudo: string) {
    const k = clave(studentId, materiaId, anio, campo)

    if (textoCrudo.trim() === '') {
      setNotas((prev) => {
        const copia = { ...prev }
        delete copia[k]
        return copia
      })
      setModificadas((prev) => new Set(prev).add(k))
      return
    }

    if (!/^\d{1,2}$/.test(textoCrudo)) return
    const valor = Number(textoCrudo)
    if (valor < 1 || valor > 10) return

    setNotas((prev) => ({ ...prev, [k]: valor }))
    setModificadas((prev) => new Set(prev).add(k))
    setAviso(null)
  }

  // Enter = saltar a la celda de abajo, dentro de la misma columna
  function alPresionarTecla(e: KeyboardEvent<HTMLDivElement>, campo: Campo, indiceFila: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      inputsRef.current[campo][indiceFila + 1]?.focus()
    }
  }

  // Promedio de cada columna (ignora las notas vacías)
  const promedios = useMemo(() => {
    const resultado: Record<Campo, string | null> = {
      term1Score: null,
      term2Score: null,
      finalScore: null,
    }
    COLUMNAS.forEach(({ campo }) => {
      const valores = alumnosDelCurso
        .map((a) => leerNota(a.id, campo))
        .filter((v): v is number => typeof v === 'number')
      if (valores.length > 0) {
        const suma = valores.reduce((acc, v) => acc + v, 0)
        resultado[campo] = (suma / valores.length).toFixed(1)
      }
    })
    return resultado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumnosDelCurso, notas, materiaId, anio])

  const totalCeldas = alumnosDelCurso.length * COLUMNAS.length
  const cargadas = alumnosDelCurso.reduce(
    (acc, a) => acc + COLUMNAS.filter(({ campo }) => leerNota(a.id, campo) !== undefined).length,
    0,
  )

  function limpiar() {
    setNotas((prev) => {
      const copia = { ...prev }
      alumnosDelCurso.forEach((a) => {
        COLUMNAS.forEach(({ campo }) => {
          const k = clave(a.id, materiaId, anio, campo)
          const original = NOTAS_INICIALES[k]
          if (original === undefined) delete copia[k]
          else copia[k] = original
        })
      })
      return copia
    })
    setModificadas((prev) => {
      const copia = new Set(prev)
      alumnosDelCurso.forEach((a) => {
        COLUMNAS.forEach(({ campo }) => copia.delete(clave(a.id, materiaId, anio, campo)))
      })
      return copia
    })
    setAviso(null)
  }

  // Guardar: junta las notas modificadas de esta selección, agrupadas por alumno.
  async function guardar() {
    const alumnosTocados = new Set<string>()
    modificadas.forEach((k) => {
      const [studentId, sId, y] = k.split('|')
      if (sId === materiaId && y === String(anio)) alumnosTocados.add(studentId as string)
    })

    const aEnviar = [...alumnosTocados].map((studentId) => ({
      studentId,
      subjectId: materiaId,
      year: anio,
      term1Score: leerNota(studentId, 'term1Score') ?? null,
      term2Score: leerNota(studentId, 'term2Score') ?? null,
      finalScore: leerNota(studentId, 'finalScore') ?? null,
    }))

    if (aEnviar.length === 0) {
      setAviso({ tipo: 'info', texto: 'No hay cambios para guardar.' })
      return
    }

    // == ENCHUFE API ==
    // En el back, cada calificación (Grade) cuelga de la inscripción del alumno
    // a la materia (enrollment). El llamado real necesita el enrollmentId de cada
    // alumno (endpoint de inscripciones) y luego manda las tres notas a POST /grades.
    console.log('Guardar calificaciones →', aEnviar)

    const materia = MATERIAS.find((m) => m.id === materiaId)
    setAviso({
      tipo: 'success',
      texto: `Se guardarían las notas de ${aEnviar.length} alumno(s) en ${materia?.nombre ?? ''}. (Ver la consola para el detalle.)`,
    })

    setModificadas(new Set())
  }

  const cursoActual = CURSOS.find((c) => c.id === cursoId)
  const materiaActual = MATERIAS.find((m) => m.id === materiaId)

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Encabezado: título a la izquierda, Edición/Consulta a la derecha */}
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Carga de calificaciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresá las notas de cada cuatrimestre y la calificación final
            </Typography>
          </Box>

          <ToggleButtonGroup
            size="small"
            exclusive
            value={modo}
            onChange={(_, nuevo: Modo | null) => {
              if (nuevo) setModo(nuevo)
            }}
            aria-label="Modo de la planilla"
            sx={{
              flexShrink: 0,
              '& .MuiToggleButton-root': {
                color: '#1a1a1a',
                borderColor: '#1a1a1a',
                '&.Mui-selected': {
                  bgcolor: '#1a1a1a',
                  color: '#fff',
                  '&:hover': { bgcolor: '#000' },
                },
              },
            }}
          >
            <ToggleButton value="edicion">Edición</ToggleButton>
            <ToggleButton value="consulta">Consulta</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Selectores */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="lbl-curso">Curso</InputLabel>
              <Select
                labelId="lbl-curso"
                label="Curso"
                value={cursoId}
                onChange={(e) => cambiarCurso(e.target.value)}
              >
                {CURSOS.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="lbl-materia">Materia</InputLabel>
              <Select
                labelId="lbl-materia"
                label="Materia"
                value={materiaId}
                onChange={(e) => {
                  setMateriaId(e.target.value)
                  setPagina(1)
                  setAviso(null)
                }}
              >
                {materiasDelCurso.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel id="lbl-anio">Año</InputLabel>
              <Select
                labelId="lbl-anio"
                label="Año"
                value={anio}
                onChange={(e) => {
                  setAnio(Number(e.target.value))
                  setPagina(1)
                  setAviso(null)
                }}
              >
                {ANIOS.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* Grilla */}
        <TableContainer component={Paper} variant="outlined">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {cursoActual?.nombre} · {materiaActual?.nombre} · {anio}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Escala: 1 a 10
            </Typography>
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={44} align="right">
                  #
                </TableCell>
                <TableCell>Apellido y Nombre</TableCell>
                <TableCell width={120}>DNI</TableCell>
                {COLUMNAS.map(({ campo, label }) => (
                  <TableCell key={campo} width={90} align="center">
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {alumnosPagina.map((alumno, i) => (
                <TableRow key={alumno.id} hover>
                  <TableCell align="right" sx={{ color: 'text.disabled' }}>
                    {(pagina - 1) * TAMANIO_PAGINA + i + 1}
                  </TableCell>
                  <TableCell>
                    {alumno.apellido}, {alumno.nombre}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{alumno.dni}</TableCell>
                  {COLUMNAS.map(({ campo }) => {
                    const valor = leerNota(alumno.id, campo)
                    const nivel = nivelNota(valor)
                    const color = COLORES[nivel]
                    return (
                      <TableCell key={campo} align="center">
                        {soloLectura ? (
                          <Chip
                            label={valor ?? '—'}
                            size="small"
                            sx={{
                              minWidth: 44,
                              fontWeight: 600,
                              bgcolor: color.bg,
                              color: color.fg,
                              border: '1px solid',
                              borderColor: color.bd,
                            }}
                          />
                        ) : (
                          <TextField
                            size="small"
                            value={valor ?? ''}
                            placeholder="—"
                            inputRef={(el: HTMLInputElement | null) => {
                              inputsRef.current[campo][i] = el
                            }}
                            onChange={(e) => editarNota(alumno.id, campo, e.target.value)}
                            onKeyDown={(e) => alPresionarTecla(e, campo, i)}
                            slotProps={{
                              htmlInput: {
                                inputMode: 'numeric',
                                maxLength: 2,
                                'aria-label': `Nota de ${alumno.apellido}, ${alumno.nombre}`,
                                style: { textAlign: 'center', width: 40, fontWeight: 600 },
                              },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': { bgcolor: color.bg },
                              '& input': { color: color.fg },
                            }}
                          />
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell />
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Promedio de la materia
                </TableCell>
                <TableCell />
                {COLUMNAS.map(({ campo }) => (
                  <TableCell
                    key={campo}
                    align="center"
                    sx={{ fontWeight: 700, color: 'text.primary' }}
                  >
                    {promedios[campo] ?? '—'}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>

        {/* Paginado: botones anterior/siguiente. Con datos reales, cada cambio
            de pagina pediria al back GET /api/grades?page=...&pageSize=... */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1.5,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Página {pagina} de {totalPaginas}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              disabled={pagina <= 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              sx={{ color: '#1a1a1a', borderColor: '#1a1a1a' }}
            >
              Anterior
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              sx={{ color: '#1a1a1a', borderColor: '#1a1a1a' }}
            >
              Siguiente
            </Button>
          </Box>
        </Box>

        {/* Pie: progreso + acciones */}
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {cargadas} de {totalCeldas} notas cargadas
          </Typography>

          {!soloLectura && (
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={limpiar}
                sx={{
                  color: '#1a1a1a',
                  borderColor: '#1a1a1a',
                  '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' },
                }}
              >
                Limpiar
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={guardar}
                sx={{
                  bgcolor: '#1a1a1a',
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#000', boxShadow: 'none' },
                }}
              >
                Guardar calificaciones
              </Button>
            </Box>
          )}
        </Box>

        {aviso && (
          <Typography
            variant="body2"
            sx={{ mt: 1.5, color: aviso.tipo === 'success' ? '#1a7f37' : 'text.secondary' }}
          >
            {aviso.texto}
          </Typography>
        )}
      </Box>
    </MainLayout>
  )
}

export default GrillaCalificacionesPage
