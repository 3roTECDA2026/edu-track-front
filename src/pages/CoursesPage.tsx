import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import MainLayout from '@/components/layout/MainLayout'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ContentCard } from '@/components/common/ContentCard'
import CustomTabs from '@/components/common/CustomTabs'
import { StandardTablePagination } from '@/components/common/StandardTablePagination'
import { SHIFT_LABELS } from '@/components/students/studentLabels'
import { TeacherAssignmentsTab } from '@/components/teacherAssignments/TeacherAssignmentsTab'
import { useClassSections } from '@/hooks/useClassSections'
import { useSubjects } from '@/hooks/useSubjects'

// Orden de los turnos en la tabla: la misma división puede existir en dos turnos
const SHIFT_ORDER: Record<string, number> = {
  MORNING: 0,
  AFTERNOON: 1,
  EVENING: 2,
  EXTRA_TIME: 3,
}

// Fila de estado (cargando, error o vacío) que ocupa todo el ancho de la tabla
const StatusRow = ({
  colSpan,
  loading,
  error,
  empty,
}: {
  colSpan: number
  loading: boolean
  error?: string
  empty: string
}) => (
  <TableRow>
    <TableCell colSpan={colSpan} align="center" sx={{ py: 4, color: 'text.secondary' }}>
      {loading ? (
        <CircularProgress size={28} />
      ) : error ? (
        <Alert severity="error" sx={{ textAlign: 'left' }}>
          {error}
        </Alert>
      ) : (
        empty
      )}
    </TableCell>
  </TableRow>
)

// Estructura institucional: cursos del ciclo activo y materias reales de la base, y la
// asignación docente
export const CoursesPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0)

  // Cursos y secciones del ciclo lectivo activo (GET /api/class-sections)
  const { sections, loading: loadingSections, error: sectionsError } = useClassSections()
  const [coursePage, setCoursePage] = useState(0)
  const [courseRowsPerPage, setCourseRowsPerPage] = useState(10)

  // Materias (GET /api/courses/subjects)
  const { subjects, loading: loadingSubjects, error: subjectsError } = useSubjects()
  const [subjectPage, setSubjectPage] = useState(0)
  const [subjectRowsPerPage, setSubjectRowsPerPage] = useState(10)

  // Cursos ordenados por año, sección y turno
  const sortedSections = useMemo(
    () =>
      [...sections].sort(
        (a, b) =>
          a.grade - b.grade ||
          a.division.localeCompare(b.division) ||
          (SHIFT_ORDER[a.shift] ?? 9) - (SHIFT_ORDER[b.shift] ?? 9)
      ),
    [sections]
  )
  // Ciclo lectivo de los cursos que se muestran (el activo)
  const activeYear = sections[0]?.year

  // Materias ordenadas por año y nombre
  const sortedSubjects = useMemo(
    () =>
      [...subjects].sort(
        (a, b) => a.gradeLevel - b.gradeLevel || a.name.localeCompare(b.name, 'es')
      ),
    [subjects]
  )

  const paginatedCourses = sortedSections.slice(
    coursePage * courseRowsPerPage,
    coursePage * courseRowsPerPage + courseRowsPerPage
  )
  const paginatedSubjects = sortedSubjects.slice(
    subjectPage * subjectRowsPerPage,
    subjectPage * subjectRowsPerPage + subjectRowsPerPage
  )

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Estructura institucional"
          subtitle="Cursos y secciones del ciclo lectivo activo, y materias de la institución."
          breadcrumbs={[
            { label: 'Inicio', href: '/home' },
            { label: 'Configuración' },
            { label: 'Estructura institucional' },
          ]}
        />

        {/* Tarjeta contenedora estándar con las pestañas */}
        <ContentCard>
          <CustomTabs
            tabs={['Cursos y secciones', 'Materias', 'Asignación docente']}
            value={currentTab}
            onChange={(_, next) => setCurrentTab(next)}
          />

          {/* PESTAÑA 0: CURSOS Y SECCIONES (del ciclo activo) */}
          {currentTab === 0 && (
            <Box>
              {activeYear && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  Ciclo lectivo {activeYear}
                </Typography>
              )}
              <TableContainer>
                <Table size="small" sx={{ minWidth: 650 }}>
                  <TableHead sx={{ backgroundColor: '#fafafa' }}>
                    <TableRow>
                      <TableCell>Año</TableCell>
                      <TableCell>Sección</TableCell>
                      <TableCell>Turno</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingSections || sectionsError || sortedSections.length === 0 ? (
                      <StatusRow
                        colSpan={3}
                        loading={loadingSections}
                        error={sectionsError}
                        empty="Todavía no hay cursos cargados en el ciclo lectivo activo."
                      />
                    ) : (
                      paginatedCourses.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {row.grade}° año
                          </TableCell>
                          <TableCell>{row.division}</TableCell>
                          <TableCell>
                            {SHIFT_LABELS[row.shift as keyof typeof SHIFT_LABELS] ?? row.shift}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <StandardTablePagination
                count={sortedSections.length}
                page={coursePage}
                rowsPerPage={courseRowsPerPage}
                onPageChange={setCoursePage}
                onRowsPerPageChange={(rows) => {
                  setCourseRowsPerPage(rows)
                  setCoursePage(0)
                }}
                itemLabel="cursos"
                sx={{ borderTop: '1px solid #e5e7eb' }}
              />
            </Box>
          )}

          {/* PESTAÑA 1: MATERIAS */}
          {currentTab === 1 && (
            <Box>
              <TableContainer>
                <Table size="small" sx={{ minWidth: 650 }}>
                  <TableHead sx={{ backgroundColor: '#fafafa' }}>
                    <TableRow>
                      <TableCell>Año</TableCell>
                      <TableCell>Materia</TableCell>
                      <TableCell>Código</TableCell>
                      <TableCell>Área</TableCell>
                      <TableCell>Horas semanales</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingSubjects || subjectsError || sortedSubjects.length === 0 ? (
                      <StatusRow
                        colSpan={5}
                        loading={loadingSubjects}
                        error={subjectsError}
                        empty="Todavía no hay materias cargadas."
                      />
                    ) : (
                      paginatedSubjects.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell sx={{ color: 'text.secondary' }}>
                            {row.gradeLevel}° año
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {row.name}
                          </TableCell>
                          <TableCell>{row.code ?? '—'}</TableCell>
                          <TableCell>{row.area ?? '—'}</TableCell>
                          <TableCell>
                            {row.hoursPerWeek !== undefined ? `${row.hoursPerWeek} hs` : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <StandardTablePagination
                count={sortedSubjects.length}
                page={subjectPage}
                rowsPerPage={subjectRowsPerPage}
                onPageChange={setSubjectPage}
                onRowsPerPageChange={(rows) => {
                  setSubjectRowsPerPage(rows)
                  setSubjectPage(0)
                }}
                itemLabel="materias"
                sx={{ borderTop: '1px solid #e5e7eb' }}
              />
            </Box>
          )}

          {/* PESTAÑA 2: ASIGNACIÓN DOCENTE */}
          {currentTab === 2 && <TeacherAssignmentsTab />}
        </ContentCard>
      </PageContainer>
    </MainLayout>
  )
}

export default CoursesPage
