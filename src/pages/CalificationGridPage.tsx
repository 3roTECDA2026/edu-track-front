import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

import {
  Alert,
  Box,
  Chip,
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
import { RepeatMark } from '@/components/common/RepeatMark'
import { StandardTablePagination } from '@/components/common/StandardTablePagination'
import { SHIFT_LABELS } from '@/components/students/studentLabels'
import PorAlumnoTab from '@/pages/PorAlumnoTab'
import { useClassSections } from '@/hooks/useClassSections'
import { useSubjects } from '@/hooks/useSubjects'
import { useGradeRoster } from '@/hooks/useGradeRoster'
import { useSaveGrades } from '@/hooks/useSaveGrades'
import {
  useSaveIntensificationResults,
  type IntensificationResultToSave,
} from '@/hooks/useSaveIntensificationResults'
import type {
  GridIntensificationPeriod,
  PreliminaryAssessment,
  RosterIntensification,
  RosterRow,
  SaveGradeInput,
} from '@/services/grades.service'
import { calculateSubjectFinalScore, formatScore } from '@/utils/grades'

type Mode = 'edit' | 'view'
type Level = 'low' | 'mid' | 'high' | 'empty'
type Term = 1 | 2

const TERMS: Term[] = [1, 2]
const ASSESSMENTS: PreliminaryAssessment[] = ['TEA', 'TEP', 'TED']
// En intensificación, con 4 o más acredita la materia (AA); con 1 a 3 sigue intensificando (CCA)
const INTENSIFICATION_PASSING_SCORE = 4
const DEFAULT_ROWS_PER_PAGE = 10
const COL_BORDER = '2px solid #d1d5db'
const HEAD_ROW1_H = 33
const TABLE_MAX_HEIGHT = 520

// Columnas de intensificación de la grilla (CRM-066)
const INTENSIFICATION_PERIODS: { period: GridIntensificationPeriod; label: string }[] = [
  { period: 'DECEMBER', label: 'DICIEMBRE' },
  { period: 'FEBRUARY_MARCH', label: 'FEB. / MARZO' },
]

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
  const [loadedAssessments, setLoadedAssessments] = useState<Record<string, PreliminaryAssessment>>(
    {}
  )
  const [modified, setModified] = useState<Set<string>>(new Set())

  // Notas de intensificación, por id del intento (CRM-066)
  const [intensificationScores, setIntensificationScores] = useState<Record<string, number>>({})
  const [loadedIntensificationScores, setLoadedIntensificationScores] = useState<
    Record<string, number>
  >({})
  const [modifiedIntensifications, setModifiedIntensifications] = useState<Set<string>>(new Set())

  const [notice, setNotice] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(
    null
  )

  // Inputs de calificación por cuatrimestre, para bajar con Enter
  const inputsRef = useRef<Record<string, Array<HTMLInputElement | null>>>({})

  const readOnly = mode === 'view'

  const yearOptions = useMemo(
    () => Array.from(new Set(sections.map((s) => s.year))).sort((a, b) => b - a),
    [sections]
  )
  const gradeOptions = useMemo(
    () =>
      Array.from(
        new Set(sections.filter((s) => year === '' || s.year === year).map((s) => s.grade))
      ).sort((a, b) => a - b),
    [sections, year]
  )
  const divisionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sections
            .filter((s) => (year === '' || s.year === year) && (grade === '' || s.grade === grade))
            .map((s) => s.division)
        )
      ).sort(),
    [sections, year, grade]
  )
  const subjectOptions = useMemo(
    () => subjects.filter((s) => grade === '' || s.gradeLevel === grade),
    [subjects, grade]
  )

  const classSectionId = useMemo(() => {
    if (year === '' || grade === '' || !division) return ''
    return (
      sections.find((s) => s.year === year && s.grade === grade && s.division === division)?.id ??
      ''
    )
  }, [sections, year, grade, division])

  const { roster, loading, error, refetch } = useGradeRoster(
    classSectionId,
    subjectId,
    year === '' ? undefined : year
  )

  const { save, saving } = useSaveGrades()
  const { save: saveResults, saving: savingResults } = useSaveIntensificationResults()

  // Cada intento de intensificación con su alumno, para armar los mensajes al guardar (CRM-066)
  const attemptsById = useMemo(() => {
    const map = new Map<string, { attempt: RosterIntensification; row: RosterRow }>()
    for (const row of roster) {
      for (const attempt of row.intensifications ?? []) map.set(attempt.id, { attempt, row })
    }
    return map
  }, [roster])

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

  // Carga lo guardado en el back: valoración y calificación de cada cuatrimestre,
  // y las notas de intensificación de diciembre y febrero/marzo
  useEffect(() => {
    const nextScores: Record<string, number> = {}
    const nextAssessments: Record<string, PreliminaryAssessment> = {}
    const nextIntensificationScores: Record<string, number> = {}
    for (const row of roster) {
      for (const attempt of row.intensifications ?? []) {
        if (typeof attempt.score === 'number') nextIntensificationScores[attempt.id] = attempt.score
      }
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
    setIntensificationScores(nextIntensificationScores)
    setLoadedIntensificationScores(nextIntensificationScores)
    setModifiedIntensifications(new Set())
  }, [roster])

  const pageRows = roster.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  // Nota final: si acreditó en una intensificación (AA), es la nota de la intensificación (CRM-066).
  // Si no, con el 2.º cuatrimestre aprobado (7 o más): el promedio de los dos, si también aprobó el
  // 1.º (E2-RF-05), o la nota con la que recuperó el 1.º durante el 2.º (Anexo 5, inc. 8.b).
  // Es la misma regla unificada que usa el cierre del ciclo en el back (CRM-052) y Por Alumno (CRM-096).
  function finalScore(row: RosterRow): number | undefined {
    return calculateSubjectFinalScore({
      term1Score: scores[termKey(row.id, 1)],
      term2Score: scores[termKey(row.id, 2)],
      term1IntensificationScore: row.grade?.term1IntensificationScore,
      intensifications: row.intensifications,
    })
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

  // Nota de intensificación (CRM-066): de 1 a 10. Una nota ya guardada se puede cambiar,
  // pero no dejar vacía (salvo con AA, que bloquea la celda)
  function editIntensificationScore(attempt: RosterIntensification, raw: string) {
    if (raw.trim() === '') {
      if (loadedIntensificationScores[attempt.id] !== undefined) {
        setNotice({
          type: 'info',
          text: 'Una nota de intensificación ya guardada no se puede dejar vacía: reemplazala por otra.',
        })
        return
      }
      setIntensificationScores((prev) => {
        const copy = { ...prev }
        delete copy[attempt.id]
        return copy
      })
      setModifiedIntensifications((prev) => {
        const next = new Set(prev)
        next.delete(attempt.id)
        return next
      })
      return
    }

    if (!/^\d{1,2}$/.test(raw)) return
    const value = Number(raw)
    if (value < 1 || value > 10) return

    setIntensificationScores((prev) => ({ ...prev, [attempt.id]: value }))
    setModifiedIntensifications((prev) => new Set(prev).add(attempt.id))
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
    if (modified.size === 0 && modifiedIntensifications.size === 0) {
      setNotice({ type: 'info', text: 'No hay cambios para guardar.' })
      return
    }

    // 1. Calificaciones de los cuatrimestres: solo se mandan los campos con valor
    let gradesOk = true
    if (modified.size > 0) {
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
      gradesOk = await save(inputs)
    }

    // 2. Notas de intensificación, con el endpoint de resultados de la CRM-058:
    // con 4 o más, AA (acredita); con 1 a 3, CCA (sigue intensificando).
    // Se reenvían los logros que ya tenía el intento, para no borrarlos.
    const results: IntensificationResultToSave[] = Array.from(modifiedIntensifications).flatMap(
      (attemptId) => {
        const entry = attemptsById.get(attemptId)
        const score = intensificationScores[attemptId]
        if (!entry || score === undefined) return []
        return [
          {
            id: attemptId,
            studentName: `${entry.row.student.lastName}, ${entry.row.student.firstName}`,
            input: {
              resultCode: score >= INTENSIFICATION_PASSING_SCORE ? 'AA' : 'CCA',
              score,
              knowledgeAtClose: entry.attempt.knowledgeAtClose,
            },
          },
        ]
      }
    )
    const { errors: resultErrors, failedIds } =
      results.length > 0 ? await saveResults(results) : { errors: [], failedIds: [] }

    // Todo guardado: se limpian los pendientes y se recarga desde el back
    if (gradesOk && resultErrors.length === 0) {
      setNotice({ type: 'success', text: 'Se guardaron las calificaciones.' })
      setModified(new Set())
      setModifiedIntensifications(new Set())
      refetch() // recargo desde el back para ver lo que realmente quedó
      return
    }

    // Algo falló: no se recarga, para no perder lo que no se pudo guardar.
    // Siguen pendientes solo los cambios que fallaron; los que se guardaron dejan de estarlo.
    const details = [
      ...(gradesOk ? [] : ['No se pudieron guardar las calificaciones de los cuatrimestres']),
      ...resultErrors,
    ]
    setNotice({
      type: 'error',
      text: `Hubo errores al guardar. ${details.join(' · ')}. Corregí y volvé a guardar.`,
    })
    if (gradesOk) setModified(new Set())
    setModifiedIntensifications(new Set(failedIds))
  }

  function clearGrades() {
    if (modified.size === 0 && modifiedIntensifications.size === 0) {
      setNotice({ type: 'info', text: 'No hay cambios sin guardar.' })
      return
    }
    setScores(loadedScores)
    setAssessments(loadedAssessments)
    setModified(new Set())
    setIntensificationScores(loadedIntensificationScores)
    setModifiedIntensifications(new Set())
    setNotice({ type: 'info', text: 'Se descartaron los cambios sin guardar.' })
  }

  function gradeInput(
    value: number | undefined,
    onChange: (raw: string) => void,
    ariaLabel: string,
    refCb?: (el: HTMLInputElement | null) => void,
    onKey?: (e: KeyboardEvent<HTMLDivElement>) => void
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
        inputProps={{
          'aria-label': `Valoración parcial (${term}° cuatri) de ${row.student.lastName}`,
        }}
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
                `Valoración parcial (${term}° cuatri) de ${row.student.lastName}`
              )
            : assessmentSelect(row, term)}
        </TableCell>
        <TableCell align="center">
          {readOnly
            ? gradeReadonly(
                score,
                gradeLevel(score),
                `Calificación final (${term}° cuatri) de ${row.student.lastName}`
              )
            : gradeInput(
                score,
                (raw) => editScore(row.id, term, raw),
                `Calificación final (${term}° cuatri) de ${row.student.lastName}`,
                (el) => {
                  inputsRef.current[inputKey][rowIndex] = el
                },
                (e) => handleKeyDown(e, term, rowIndex)
              )}
        </TableCell>
      </React.Fragment>
    )
  }

  // Columnas de intensificación (CRM-066). La celda se habilita solo si el alumno está asignado
  // a ese período (es decir, si no aprobó la materia). Con AA, queda bloqueada.
  function intensificationCells(row: RosterRow) {
    return INTENSIFICATION_PERIODS.map(({ period, label }, index) => {
      const attempt = (row.intensifications ?? []).find((item) => item.period === period)
      const ariaLabel = `Intensificación ${label.toLowerCase()} de ${row.student.lastName}`
      const value = attempt ? intensificationScores[attempt.id] : undefined
      const editable = attempt !== undefined && attempt.resultCode !== 'AA' && !readOnly
      return (
        <TableCell
          key={`int-${period}`}
          align="center"
          sx={index === 0 ? { borderLeft: COL_BORDER } : undefined}
        >
          {editable
            ? gradeInput(value, (raw) => editIntensificationScore(attempt, raw), ariaLabel)
            : gradeReadonly(value, gradeLevel(value), ariaLabel)}
        </TableCell>
      )
    })
  }

  const totalCols = 3 + TERMS.length * 2 + INTENSIFICATION_PERIODS.length + 1

  const emptyMessage =
    !classSectionId || !subjectId
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
          subtitle="Cargá la valoración parcial (TEA, TEP o TED) y la calificación final de cada cuatrimestre. La nota final se calcula sola. En intensificación, con 4 o más la materia queda acreditada."
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
                  sx={{ minWidth: 1040, '& .MuiTableCell-root': { px: 1.25 } }}
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
                      {/* Agrupador de las columnas de intensificación (CRM-066) */}
                      <TableCell
                        colSpan={INTENSIFICATION_PERIODS.length}
                        align="center"
                        sx={{ ...headSx, borderLeft: COL_BORDER }}
                      >
                        INTENSIFICACIÓN
                      </TableCell>
                      <TableCell
                        width={96}
                        rowSpan={2}
                        align="center"
                        sx={{ ...headSx, borderLeft: COL_BORDER }}
                      >
                        NOTA FINAL
                      </TableCell>
                    </TableRow>
                    {/* Fila 2: valoración parcial y calificación final de cada cuatrimestre,
                        y los dos períodos de intensificación */}
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
                      {INTENSIFICATION_PERIODS.map(({ period, label }, index) => (
                        <TableCell
                          key={`int-head-${period}`}
                          width={96}
                          align="center"
                          sx={{
                            ...headSx,
                            top: HEAD_ROW1_H,
                            ...(index === 0 && { borderLeft: COL_BORDER }),
                          }}
                        >
                          {label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {pageRows.map((row, i) => {
                      const finalValue = finalScore(row)
                      const homeSection = row.student.enrollmentHistory?.[0]?.classSection
                      const isInterSection = Boolean(
                        homeSection && homeSection.id !== classSectionId
                      )
                      return (
                        <TableRow key={row.id} hover>
                          <TableCell align="right" sx={{ color: '#9ca3af' }}>
                            {page * rowsPerPage + i + 1}
                          </TableCell>
                          <TableCell sx={{ color: '#111827', whiteSpace: 'nowrap' }}>
                            {row.student.lastName}, {row.student.firstName}
                            {isInterSection && homeSection && (
                              <Chip
                                size="small"
                                label={`Inter-sección: ${homeSection.grade}°${homeSection.division} ${SHIFT_LABELS[homeSection.shift]}`}
                                sx={{
                                  ml: 1,
                                  height: 20,
                                  fontSize: '0.7rem',
                                  bgcolor: 'action.hover',
                                  color: 'text.secondary',
                                }}
                              />
                            )}
                            {row.courseType === 'REPEAT' && <RepeatMark />}
                          </TableCell>
                          <TableCell sx={{ color: '#374151' }}>{row.student.dni}</TableCell>

                          {TERMS.map((term) => termCells(row, term, i))}

                          {intensificationCells(row)}

                          {/* Nota final (calculada, o la de la intensificación si acreditó) */}
                          <TableCell align="center" sx={{ borderLeft: COL_BORDER }}>
                            {gradeReadonly(
                              finalValue === undefined ? undefined : formatScore(finalValue),
                              gradeLevel(finalValue),
                              `Nota final de ${row.student.lastName}`
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {pageRows.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={totalCols}
                          align="center"
                          sx={{ py: 4, color: '#9ca3af' }}
                        >
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
              label={saving || savingResults ? 'Guardando…' : 'Guardar'}
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
