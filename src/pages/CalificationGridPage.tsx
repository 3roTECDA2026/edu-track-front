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
import PorAlumnoTab from '@/pages/PorAlumnoTab'
import { useClassSections } from '@/hooks/useClassSections'
import { useSubjects } from '@/hooks/useSubjects'
import { useGradeRoster } from '@/hooks/useGradeRoster'
import { useSaveGrades } from '@/hooks/useSaveGrades'
import type { PreliminaryAssessment, RosterRow, SaveGradeInput } from '@/services/grades.service'

type Mode = 'edit' | 'view'
type Level = 'low' | 'mid' | 'high' | 'empty'
type Term = 1 | 2

const TERMS: Term[] = [1, 2]
const ASSESSMENTS: PreliminaryAssessment[] = ['TEA', 'TEP', 'TED']
// Nota mínima para aprobar el cuatrimestre: con 7 o más en los dos, la final es el promedio (E2-RF-05)
const PASSING_SCORE = 7
const DEFAULT_ROWS_PER_PAGE = 10
const COL_BORDER = '2px solid #d1d5db'
const HEAD_ROW1_H = 33
const TABLE_MAX_HEIGHT = 520

// Clave de un dato de un alumno en un cuatrimestre
const termKey = (enrollmentId: string, term: Term) => `${enrollmentId}|${term}`

function gradeLevel(value: number | undefined): Level {
  if (value === undefined) return 'empty'
  if (value < 4) return 'low'
  if (value <= 6) return 'mid'
  return 'high'
}

// TEA = trayectoria avanzada, TEP = en proceso, TED = discontinua
const ASSESSMENT_LEVEL: Record<PreliminaryAssessment, Level> = {
  TEA: 'high',
  TEP: 'mid',
  TED: 'low',
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

  // Calificación final y valoración parcial de cada cuatrimestre, por alumno
  const [scores, setScores] = useState<Record<string, number>>({})
  const [assessments, setAssessments] = useState<Record<string, PreliminaryAssessment>>({})
  const [loadedScores, setLoadedScores] = useState<Record<string, number>>({})
  const [loadedAssessments, setLoadedAssessments] = useState<
    Record<string, PreliminaryAssessment>
  >({})
  const [modified, setModified] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(
    null,
  )

  // Inputs de calificación por cuatrimestre, para bajar con Enter
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

  // Carga lo guardado en el back: valoración y calificación de cada cuatrimestre
  useEffect(() => {
    const nextScores: Record<string, number> = {}
    const nextAssessments: Record<string, PreliminaryAssessment> = {}
    for (const row of roster) {
      const g = row.grade
      if (!g) continue
      if (typeof g.term1Score === 'number') nextScores[termKey(row.id, 1)] = g.term1Score
      if (typeof g.term2Score === 'number') nextScores[termKey(row.id, 2)] = g.term2Score
      if (g.preliminaryAssessment1) nextAssessments[termKey(row.id, 1)] = g.preliminaryAssessment1
      if (g.preliminaryAssessment2) nextAssessments[termKey(row.id, 2)] = g.preliminaryAssessment2
    }
    setScores(nextScores)
    setAssessments(nextAssessments)
    setLoadedScores(nextScores)
    setLoadedAssessments(nextAssessments)
    setModified(new Set())
  }, [roster])

  const pageRows = roster.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  // Nota final: promedio de los dos cuatrimestres, solo si aprobó los dos con 7 o más (E2-RF-05).
  // Si no, queda vacía hasta la intensificación.
  function finalScore(enrollmentId: string): number | undefined {
    const first = scores[termKey(enrollmentId, 1)]
    const second = scores[termKey(enrollmentId, 2)]
    if (first === undefined || second === undefined) return undefined
    if (first < PASSING_SCORE || second < PASSING_SCORE) return undefined
    return Math.round(((first + second) / 2) * 10) / 10
  }

  function editScore(enrollmentId: string, term: Term, raw: string) {
    const key = termKey(enrollmentId, term)

    if (raw.trim() === '') {
      // El back no permite dejar vacía una calificación ya guardada
      if (loadedScores[key] !== undefined) {
        setNotice({
          type: 'info',
          text: 'Una calificación ya guardada no se puede dejar vacía: reemplazala por otra.',
        })
        return
      }
      setScores((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
      return
    }

    if (!/^\d{1,2}$/.test(raw)) return
    const value = Number(raw)
    if (value < 1 || value > 10) return

    setScores((prev) => ({ ...prev, [key]: value }))
    setModified((prev) => new Set(prev).add(enrollmentId))
    setNotice(null)
  }

  function editAssessment(enrollmentId: string, term: Term, value: PreliminaryAssessment) {
    setAssessments((prev) => ({ ...prev, [termKey(enrollmentId, term)]: value }))
    setModified((prev) => new Set(prev).add(enrollmentId))
    setNotice(null)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>, term: Term, rowIndex: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      inputsRef.current[`score-${term}`]?.[rowIndex + 1]?.focus()
    }
  }

  async function saveGrades() {
    if (modified.size === 0) {
      setNotice({ type: 'info', text: 'No hay cambios para guardar.' })
      return
    }

    // Solo se mandan los campos con valor
    const inputs: SaveGradeInput[] = Array.from(modified).map((enrollmentId) => {
      const input: SaveGradeInput = { enrollmentId }
      const assessment1 = assessments[termKey(enrollmentId, 1)]
      const assessment2 = assessments[termKey(enrollmentId, 2)]
      const score1 = scores[termKey(enrollmentId, 1)]
      const score2 = scores[termKey(enrollmentId, 2)]
      if (assessment1) input.preliminaryAssessment1 = assessment1
      if (score1 !== undefined) input.term1Score = score1
      if (assessment2) input.preliminaryAssessment2 = assessment2
      if (score2 !== undefined) input.term2Score = score2
      return input
    })

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
    setScores(loadedScores)
    setAssessments(loadedAssessments)
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

  function gradeReadonly(value: number | string | undefined, level: Level, ariaLabel: string) {
    const color = COLORS[level]
    return (
      <TextField
        size="small"
        value={value ?? '—'}
        disabled
        slotProps={{
          htmlInput: {
            'aria-label': ariaLabel,
            style: { textAlign: 'center', width: 34, fontWeight: 700 },
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

  // Selector de valoración parcial: TEA, TEP o TED
  function assessmentSelect(row: RosterRow, term: Term) {
    const key = termKey(row.id, term)
    const value = assessments[key]
    const color = COLORS[value ? ASSESSMENT_LEVEL[value] : 'empty']
    return (
      <Select
        size="small"
        value={value ?? ''}
        displayEmpty
        onChange={(e) => editAssessment(row.id, term, e.target.value as PreliminaryAssessment)}
        inputProps={{ 'aria-label': `Valoración parcial (${term}° cuatri) de ${row.student.lastName}` }}
        sx={{
          minWidth: 82,
          bgcolor: color.bg,
          fontWeight: 700,
          color: color.fg,
          '& .MuiSelect-select': { py: 0.5, textAlign: 'center' },
        }}
      >
        {/* Una valoración ya guardada se puede cambiar, pero no dejar vacía */}
        <MenuItem value="" disabled={loadedAssessments[key] !== undefined}>
          —
        </MenuItem>
        {ASSESSMENTS.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    )
  }

  // Las dos columnas de un cuatrimestre: valoración parcial y calificación final
  function termCells(row: RosterRow, term: Term, rowIndex: number) {
    const key = termKey(row.id, term)
    const assessment = assessments[key]
    const score = scores[key]
    const inputKey = `score-${term}`
    if (!inputsRef.current[inputKey]) inputsRef.current[inputKey] = []

    return (
      <React.Fragment key={`term-${term}`}>
        <TableCell align="center" sx={{ borderLeft: COL_BORDER }}>
          {readOnly
            ? gradeReadonly(
                assessment,
                assessment ? ASSESSMENT_LEVEL[assessment] : 'empty',
                `Valoración parcial (${term}° cuatri) de ${row.student.lastName}`,
              )
            : assessmentSelect(row, term)}
        </TableCell>
        <TableCell align="center">
          {readOnly
            ? gradeReadonly(
                score,
                gradeLevel(score),
                `Calificación final (${term}° cuatri) de ${row.student.lastName}`,
              )
            : gradeInput(
                score,
                (raw) => editScore(row.id, term, raw),
                `Calificación final (${term}° cuatri) de ${row.student.lastName}`,
                (el) => {
                  inputsRef.current[inputKey][rowIndex] = el
                },
                (e) => handleKeyDown(e, term, rowIndex),
              )}
        </TableCell>
      </React.Fragment>
    )
  }

  const totalCols = 3 + TERMS.length * 2 + 1

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
          subtitle="Cargá la valoración parcial (TEA, TEP o TED) y la calificación final de cada cuatrimestre. La nota final se calcula sola."
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
              {/* Filtros + modo */}
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

              {/* Grilla */}
              <TableContainer sx={{ overflowX: 'auto', maxHeight: TABLE_MAX_HEIGHT }}>
                <Table
                  stickyHeader
                  size="small"
                  sx={{ minWidth: 860, '& .MuiTableCell-root': { px: 1.25 } }}
                >
                  <TableHead sx={{ backgroundColor: '#fafafa' }}>
                    {/* Fila 1: agrupadores */}
                    <TableRow>
                      <TableCell width={44} align="right" rowSpan={2} sx={headSx}>
                        #
                      </TableCell>
                      <TableCell width={190} rowSpan={2} sx={headSx}>
                        APELLIDO Y NOMBRE
                      </TableCell>
                      <TableCell width={92} rowSpan={2} sx={headSx}>
                        DNI
                      </TableCell>
                      {TERMS.map((term) => (
                        <TableCell
                          key={`group-${term}`}
                          colSpan={2}
                          align="center"
                          sx={{ ...headSx, borderLeft: COL_BORDER }}
                        >
                          {term}° CUATRIMESTRE
                        </TableCell>
                      ))}
                      <TableCell
                        width={96}
                        rowSpan={2}
                        align="center"
                        sx={{ ...headSx, borderLeft: COL_BORDER }}
                      >
                        NOTA FINAL
                      </TableCell>
                    </TableRow>
                    {/* Fila 2: valoración parcial y calificación final de cada cuatrimestre */}
                    <TableRow>
                      {TERMS.map((term) => (
                        <React.Fragment key={`cols-${term}`}>
                          <TableCell
                            width={120}
                            align="center"
                            sx={{ ...headSx, top: HEAD_ROW1_H, borderLeft: COL_BORDER }}
                          >
                            VALORACIÓN PARCIAL
                          </TableCell>
                          <TableCell
                            width={120}
                            align="center"
                            sx={{ ...headSx, top: HEAD_ROW1_H }}
                          >
                            CALIFICACIÓN FINAL
                          </TableCell>
                        </React.Fragment>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {pageRows.map((row, i) => {
                      const finalValue = finalScore(row.id)
                      return (
                        <TableRow key={row.id} hover>
                          <TableCell align="right" sx={{ color: '#9ca3af' }}>
                            {page * rowsPerPage + i + 1}
                          </TableCell>
                          <TableCell sx={{ color: '#111827', whiteSpace: 'nowrap' }}>
                            {row.student.lastName}, {row.student.firstName}
                          </TableCell>
                          <TableCell sx={{ color: '#374151' }}>{row.student.dni}</TableCell>

                          {TERMS.map((term) => termCells(row, term, i))}

                          {/* Nota final (calculada) */}
                          <TableCell align="center" sx={{ borderLeft: COL_BORDER }}>
                            {gradeReadonly(
                              finalValue,
                              gradeLevel(finalValue),
                              `Nota final de ${row.student.lastName}`,
                            )}
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

          {/* PESTAÑA 1: POR ALUMNO */}
          {tab === 1 && <PorAlumnoTab />}
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