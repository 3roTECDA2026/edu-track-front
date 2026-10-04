import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import MainLayout from '@/components/layout/MainLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import { CustomTabs } from '@/components/common/CustomTabs'
import { AddButton } from '@/components/common/AddButton'
import { StandardTablePagination } from '@/components/common/StandardTablePagination'
import { useClassSections } from '@/hooks/useClassSections'
import { useSubjects } from '@/hooks/useSubjects'
import { useGradeRoster } from '@/hooks/useGradeRoster'
import { useSaveGrades } from '@/hooks/useSaveGrades'
import type { RosterRow, SaveGradeInput } from '@/services/grades.service'

type Mode = 'edit' | 'view'
type Level = 'low' | 'mid' | 'high' | 'empty'
type Term = 1 | 2
type NoteSlot = 1 | 2 | 3 | 4

const NOTE_SLOTS: NoteSlot[] = [1, 2, 3, 4]
const DEFAULT_ROWS_PER_PAGE = 10
const COL_BORDER = '2px solid #d1d5db'
const HEAD_ROW1_H = 33
const TABLE_MAX_HEIGHT = 520


const gradeKey = (enrollmentId: string, term: Term, slot: NoteSlot) =>
  `${enrollmentId}|${term}|${slot}`

function gradeLevel(value: number | undefined): Level {
  if (value === undefined) return 'empty'
  if (value < 4) return 'low'
  if (value <= 6) return 'mid'
  return 'high'
}

const COLORS: Record<Level, { bg: string; fg: string; bd: string }> = {
  low: { bg: '#fdecec', fg: '#b42318', bd: '#f0b4b4' },
  mid: { bg: '#fdf6e3', fg: '#8a6a00', bd: '#eddca0' },
  high: { bg: '#e9f7ee', fg: '#1a7f37', bd: '#a9e0bd' },
  empty: { bg: 'transparent', fg: 'text.disabled', bd: 'divider' },
}


const headSx = {
  fontWeight: 700,
  color: '#4b5563',
  fontSize: '0.75rem',
  letterSpacing: '0.05em',
  backgroundColor: '#fafafa',
} as const

export const CalificationGridPage: React.FC = () => {
  const [tab, setTab] = useState<number>(0)

  const { sections } = useClassSections()
  const { subjects } = useSubjects()

  
  const [year, setYear] = useState<number | ''>('')
  const [grade, setGrade] = useState<number | ''>('')
  const [division, setDivision] = useState<string>('')
  const [subjectId, setSubjectId] = useState<string>('')

  const [mode, setMode] = useState<Mode>('view')
  const [page, setPage] = useState<number>(0) // base 0 (MUI)
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_ROWS_PER_PAGE)

  
  const [grades, setGrades] = useState<Record<string, number>>({})
  const [loadedGrades, setLoadedGrades] = useState<Record<string, number>>({})
  const [modified, setModified] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(
    null,
  )

  
  const inputsRef = useRef<Record<string, Array<HTMLInputElement | null>>>({})

  const readOnly = mode === 'view'

  const yearOptions = useMemo(
    () => Array.from(new Set(sections.map((s) => s.year))).sort((a, b) => b - a),
    [sections],
  )
  const gradeOptions = useMemo(
    () =>
      Array.from(
        new Set(sections.filter((s) => year === '' || s.year === year).map((s) => s.grade)),
      ).sort((a, b) => a - b),
    [sections, year],
  )
  const divisionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sections
            .filter(
              (s) => (year === '' || s.year === year) && (grade === '' || s.grade === grade),
            )
            .map((s) => s.division),
        ),
      ).sort(),
    [sections, year, grade],
  )
  const subjectOptions = useMemo(
    () => subjects.filter((s) => grade === '' || s.gradeLevel === grade),
    [subjects, grade],
  )

  const classSectionId = useMemo(() => {
    if (year === '' || grade === '' || !division) return ''
    return (
      sections.find((s) => s.year === year && s.grade === grade && s.division === division)?.id ?? ''
    )
  }, [sections, year, grade, division])

  
  const { roster, loading, error, refetch } = useGradeRoster(
    classSectionId,
    subjectId,
    year === '' ? undefined : year,
  )

  const { save, saving } = useSaveGrades()

 
  useEffect(() => {
    if (yearOptions.length === 0) return
    if (year === '' || !yearOptions.includes(year)) setYear(yearOptions[0])
  }, [yearOptions, year])

  useEffect(() => {
    if (gradeOptions.length === 0) {
      if (grade !== '') setGrade('')
      return
    }
    if (grade === '' || !gradeOptions.includes(grade)) setGrade(gradeOptions[0])
  }, [gradeOptions, grade])

  useEffect(() => {
    if (divisionOptions.length === 0) {
      if (division) setDivision('')
      return
    }
    if (!divisionOptions.includes(division)) setDivision(divisionOptions[0])
  }, [divisionOptions, division])

  useEffect(() => {
    if (subjectOptions.length === 0) {
      if (subjectId) setSubjectId('')
      return
    }
    if (!subjectOptions.some((s) => s.id === subjectId)) setSubjectId(subjectOptions[0].id)
  }, [subjectOptions, subjectId])

  
  useEffect(() => {
    const next: Record<string, number> = {}
    for (const row of roster) {
      const g = row.grade
      if (!g) continue
      NOTE_SLOTS.forEach((slot, i) => {
        const v1 = g.term1Scores?.[i]
        if (typeof v1 === 'number') next[gradeKey(row.id, 1, slot)] = v1
        const v2 = g.term2Scores?.[i]
        if (typeof v2 === 'number') next[gradeKey(row.id, 2, slot)] = v2
      })
    }
    setGrades(next)
    setLoadedGrades(next)
    setModified(new Set())
  }, [roster])

  const pageRows = roster.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const readGrade = (enrollmentId: string, term: Term, slot: NoteSlot): number | undefined =>
    grades[gradeKey(enrollmentId, term, slot)]

  
  function termAverage(enrollmentId: string, term: Term): number | undefined {
    const values = NOTE_SLOTS.map((slot) => readGrade(enrollmentId, term, slot)).filter(
      (v): v is number => typeof v === 'number',
    )
    if (values.length === 0) return undefined
    const sum = values.reduce((acc, v) => acc + v, 0)
    return Math.round((sum / values.length) * 10) / 10
  }

  
  function finalAverage(enrollmentId: string): number | undefined {
    const parts = [termAverage(enrollmentId, 1), termAverage(enrollmentId, 2)].filter(
      (v): v is number => typeof v === 'number',
    )
    if (parts.length === 0) return undefined
    const sum = parts.reduce((acc, v) => acc + v, 0)
    return Math.round((sum / parts.length) * 10) / 10
  }

  function editGrade(enrollmentId: string, term: Term, slot: NoteSlot, raw: string) {
    const key = gradeKey(enrollmentId, term, slot)

    if (raw.trim() === '') {
      setGrades((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
      setModified((prev) => new Set(prev).add(enrollmentId))
      return
    }

    if (!/^\d{1,2}$/.test(raw)) return
    const value = Number(raw)
    if (value < 1 || value > 10) return

    setGrades((prev) => ({ ...prev, [key]: value }))
    setModified((prev) => new Set(prev).add(enrollmentId))
    setNotice(null)
  }

  function handleKeyDown(
    e: KeyboardEvent<HTMLDivElement>,
    term: Term,
    slot: NoteSlot,
    rowIndex: number,
  ) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const colKey = `${term}-${slot}`
      inputsRef.current[colKey]?.[rowIndex + 1]?.focus()
    }
  }

  async function saveGrades() {
    if (modified.size === 0) {
      setNotice({ type: 'info', text: 'No hay cambios para guardar.' })
      return
    }
    
    const inputs: SaveGradeInput[] = Array.from(modified).map((enrollmentId) => ({
      enrollmentId,
      term1Scores: NOTE_SLOTS.map((slot) => readGrade(enrollmentId, 1, slot) ?? null),
      term2Scores: NOTE_SLOTS.map((slot) => readGrade(enrollmentId, 2, slot) ?? null),
    }))

    const ok = await save(inputs)
    if (ok) {
      setNotice({ type: 'success', text: 'Se guardaron las calificaciones.' })
      setModified(new Set())
      refetch() // recargo desde el back para ver lo que realmente quedó
    } else {
      setNotice({ type: 'error', text: 'Hubo un error al guardar. Probá de nuevo.' })
    }
  }

      
  function clearGrades() {
    if (modified.size === 0) {
      setNotice({ type: 'info', text: 'No hay cambios sin guardar.' })
      return
    }
    setGrades(loadedGrades)
    setModified(new Set())
    setNotice({ type: 'info', text: 'Se descartaron los cambios sin guardar.' })
  }

  
  function gradeInput(
    value: number | undefined,
    onChange: (raw: string) => void,
    ariaLabel: string,
    refCb?: (el: HTMLInputElement | null) => void,
    onKey?: (e: KeyboardEvent<HTMLDivElement>) => void,
  ) {
    const color = COLORS[gradeLevel(value)]
    return (
      <TextField
        size="small"
        value={value ?? ''}
        placeholder="—"
        inputRef={refCb}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKey}
        slotProps={{
          htmlInput: {
            inputMode: 'numeric',
            maxLength: 2,
            'aria-label': ariaLabel,
            style: { textAlign: 'center', width: 26, fontWeight: 600 },
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': { bgcolor: color.bg },
          '& .MuiOutlinedInput-input': { py: 0.5, px: 0.25 },
          '& input': { color: color.fg },
        }}
      />
    )
  }

  
  function gradeReadonly(value: number | undefined, ariaLabel: string) {
    const color = COLORS[gradeLevel(value)]
    return (
      <TextField
        size="small"
        value={value ?? '—'}
        disabled
        slotProps={{
          htmlInput: {
            'aria-label': ariaLabel,
            style: { textAlign: 'center', width: 26, fontWeight: 700 },
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': { bgcolor: color.bg },
          '& .MuiOutlinedInput-input': { py: 0.5, px: 0.25 },
          '& .MuiInputBase-input.Mui-disabled': {
            color: color.fg,
            WebkitTextFillColor: color.fg,
          },
        }}
      />
    )
  }

  
  function noteCells(row: RosterRow, term: Term, rowIndex: number) {
    return NOTE_SLOTS.map((slot) => {
      const value = readGrade(row.id, term, slot)
      const colKey = `${term}-${slot}`
      if (!inputsRef.current[colKey]) inputsRef.current[colKey] = []
      return (
        <TableCell
          key={colKey}
          align="center"
          sx={{ borderLeft: slot === 1 ? COL_BORDER : undefined }}
        >
          {readOnly
            ? gradeReadonly(value, `Nota ${slot} (${term}° cuatri) de ${row.student.lastName}`)
            : gradeInput(
                value,
                (raw) => editGrade(row.id, term, slot, raw),
                `Nota ${slot} (${term}° cuatri) de ${row.student.lastName}`,
                (el) => {
                  inputsRef.current[colKey][rowIndex] = el
                },
                (e) => handleKeyDown(e, term, slot, rowIndex),
              )}
        </TableCell>
      )
    })
  }

  const totalCols = 3 + (NOTE_SLOTS.length + 1) * 2 + 1

  
  const emptyMessage = !classSectionId || !subjectId
    ? 'Elegí curso, sección, materia y año para ver la planilla.'
    : loading
      ? 'Cargando alumnos…'
      : error
        ? `No se pudo cargar: ${error}`
        : 'No hay alumnos inscriptos en esta materia.'

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1280, mx: 'auto', p: 1 }}>
        {/* Encabezado estándar: breadcrumb + título + subtítulo */}
        <PageHeader
          title="Carga de calificaciones"
          subtitle="Ingresá las 4 notas de cada cuatrimestre. El promedio y la nota final se calculan solos."
          breadcrumbs={[
            { label: 'Inicio', href: '/' },
            { label: 'Calificaciones' },
            { label: 'Carga de notas' },
          ]}
        />

        {/* Tarjeta contenedora principal */}
        <ContentCard>
          {/* Navegación por pestañas */}
          <CustomTabs
            tabs={['Por materia', 'Por alumno']}
            value={tab}
            onChange={(_, next) => setTab(next)}
          />

          {/* PESTAÑA 0: POR MATERIA */}
          {tab === 0 && (
            <Box>
              {/* Filtros + modo (sin selector de cuatrimestre) */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="lbl-course">Curso</InputLabel>
                  <Select
                    labelId="lbl-course"
                    label="Curso"
                    value={grade === '' ? '' : String(grade)}
                    onChange={(e) => {
                      setGrade(e.target.value === '' ? '' : Number(e.target.value))
                      setPage(0)
                      setNotice(null)
                    }}
                  >
                    {gradeOptions.map((g) => (
                      <MenuItem key={g} value={String(g)}>
                        {g}° Año
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 110 }}>
                  <InputLabel id="lbl-section">Sección</InputLabel>
                  <Select
                    labelId="lbl-section"
                    label="Sección"
                    value={division}
                    onChange={(e) => {
                      setDivision(e.target.value)
                      setPage(0)
                      setNotice(null)
                    }}
                  >
                    {divisionOptions.map((d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="lbl-subject">Materia</InputLabel>
                  <Select
                    labelId="lbl-subject"
                    label="Materia"
                    value={subjectId}
                    onChange={(e) => {
                      setSubjectId(e.target.value)
                      setPage(0)
                      setNotice(null)
                    }}
                  >
                    {subjectOptions.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel id="lbl-year">Año</InputLabel>
                  <Select
                    labelId="lbl-year"
                    label="Año"
                    value={year === '' ? '' : String(year)}
                    onChange={(e) => {
                      setYear(e.target.value === '' ? '' : Number(e.target.value))
                      setPage(0)
                      setNotice(null)
                    }}
                  >
                    {yearOptions.map((y) => (
                      <MenuItem key={y} value={String(y)}>
                        {y}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Modo Edición / Consulta, alineado a la derecha */}
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={mode}
                  onChange={(_, next: Mode | null) => next && setMode(next)}
                  aria-label="Modo de la planilla"
                  sx={{
                    ml: 'auto',
                    '& .MuiToggleButton-root': {
                      textTransform: 'none',
                      fontWeight: 600,
                      color: '#111827',
                      backgroundColor: '#ffffff',
                      borderColor: '#d1d5db',
                      '&.Mui-selected': {
                        color: '#ffffff',
                        backgroundColor: '#111827',
                        '&:hover': { backgroundColor: '#1f2937' },
                      },
                    },
                  }}
                >
                  <ToggleButton value="edit">Edición</ToggleButton>
                  <ToggleButton value="view">Consulta</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {notice && (
                <Alert severity={notice.type} onClose={() => setNotice(null)} sx={{ m: 2 }}>
                  {notice.text}
                </Alert>
              )}

              {/* Grilla (scroll horizontal: no entra todo en pantalla) */}
              <TableContainer sx={{ overflowX: 'auto', maxHeight: TABLE_MAX_HEIGHT }}>
                <Table
                  stickyHeader
                  size="small"
                  sx={{ minWidth: 1060, '& .MuiTableCell-root': { px: 1.25 } }}
                >
                  <TableHead sx={{ backgroundColor: '#fafafa' }}>
                    {/* Fila 1: agrupadores */}
                    <TableRow>
                      <TableCell width={44} align="right" rowSpan={2} sx={headSx}>
                        #
                      </TableCell>
                      <TableCell width={170} rowSpan={2} sx={headSx}>
                        APELLIDO Y NOMBRE
                      </TableCell>
                      <TableCell width={92} rowSpan={2} sx={headSx}>
                        DNI
                      </TableCell>
                      <TableCell
                        colSpan={NOTE_SLOTS.length + 1}
                        align="center"
                        sx={{ ...headSx, borderLeft: COL_BORDER }}
                      >
                        1° CUATRIMESTRE
                      </TableCell>
                      <TableCell
                        colSpan={NOTE_SLOTS.length + 1}
                        align="center"
                        sx={{ ...headSx, borderLeft: COL_BORDER }}
                      >
                        2° CUATRIMESTRE
                      </TableCell>
                      <TableCell
                        width={86}
                        rowSpan={2}
                        align="center"
                        sx={{ ...headSx, borderLeft: COL_BORDER }}
                      >
                        FINAL
                      </TableCell>
                    </TableRow>
                    {/* Fila 2: notas + promedio de cada cuatri */}
                    <TableRow>
                      {NOTE_SLOTS.map((slot) => (
                        <TableCell
                          key={`h1-${slot}`}
                          width={70}
                          align="center"
                          sx={{ ...headSx, top: HEAD_ROW1_H, borderLeft: slot === 1 ? COL_BORDER : undefined }}
                        >
                          NOTA {slot}
                        </TableCell>
                      ))}
                      <TableCell width={80} align="center" sx={{ ...headSx, top: HEAD_ROW1_H }}>
                        PROM.
                      </TableCell>
                      {NOTE_SLOTS.map((slot) => (
                        <TableCell
                          key={`h2-${slot}`}
                          width={70}
                          align="center"
                          sx={{ ...headSx, top: HEAD_ROW1_H, borderLeft: slot === 1 ? COL_BORDER : undefined }}
                        >
                          NOTA {slot}
                        </TableCell>
                      ))}
                      <TableCell width={80} align="center" sx={{ ...headSx, top: HEAD_ROW1_H }}>
                        PROM.
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {pageRows.map((row, i) => {
                      const avg1 = termAverage(row.id, 1)
                      const avg2 = termAverage(row.id, 2)
                      const finalValue = finalAverage(row.id)
                      return (
                        <TableRow key={row.id} hover>
                          <TableCell align="right" sx={{ color: '#9ca3af' }}>
                            {page * rowsPerPage + i + 1}
                          </TableCell>
                          <TableCell sx={{ color: '#111827', whiteSpace: 'nowrap' }}>
                            {row.student.lastName}, {row.student.firstName}
                          </TableCell>
                          <TableCell sx={{ color: '#374151' }}>{row.student.dni}</TableCell>

                          {/* 1° cuatrimestre */}
                          {noteCells(row, 1, i)}
                          <TableCell align="center">
                            {gradeReadonly(avg1, `Promedio 1° cuatri de ${row.student.lastName}`)}
                          </TableCell>

                          {/* 2° cuatrimestre */}
                          {noteCells(row, 2, i)}
                          <TableCell align="center">
                            {gradeReadonly(avg2, `Promedio 2° cuatri de ${row.student.lastName}`)}
                          </TableCell>

                          {/* Final (calculado) */}
                          <TableCell align="center" sx={{ borderLeft: COL_BORDER }}>
                            {gradeReadonly(finalValue, `Nota final de ${row.student.lastName}`)}
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {pageRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={totalCols} align="center" sx={{ py: 4, color: '#9ca3af' }}>
                          {emptyMessage}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <StandardTablePagination
                count={roster.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={(rows) => {
                  setRowsPerPage(rows)
                  setPage(0)
                }}
                itemLabel="alumnos"
                rowsPerPageOptions={[10, 25, 50]}
              />
            </Box>
          )}

          {/* PESTAÑA 1: POR ALUMNO (en desarrollo) */}
          {tab === 1 && (
            <Box sx={{ p: 2 }}>
              <Alert severity="info">
                La vista por alumno (promedio general de todas sus materias) está en desarrollo.
              </Alert>
            </Box>
          )}
        </ContentCard>

        {/* Acciones: debajo de la tabla y el paginado */}
        {tab === 0 && !readOnly && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2 }}>
            <AddButton label="Limpiar" icon={<RestartAltIcon />} onClick={clearGrades} />
            <AddButton
              label={saving ? 'Guardando…' : 'Guardar'}
              icon={<SaveIcon />}
              onClick={saveGrades}
            />
          </Box>
        )}
      </Box>
    </MainLayout>
  )
}

export default CalificationGridPage
