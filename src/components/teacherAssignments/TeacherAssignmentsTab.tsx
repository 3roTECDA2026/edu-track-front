import { useMemo, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { AddButton } from '@/components/common/AddButton';
import { useNotify } from '@/components/layout/NotificationProvider';
import { DeleteTeacherAssignmentDialog } from '@/components/teacherAssignments/DeleteTeacherAssignmentDialog';
import { TeacherAssignmentFilters } from '@/components/teacherAssignments/TeacherAssignmentFilters';
import { TeacherAssignmentFormDialog } from '@/components/teacherAssignments/TeacherAssignmentFormDialog';
import { TeacherAssignmentsTable } from '@/components/teacherAssignments/TeacherAssignmentsTable';
import { getAssignmentErrorMessage } from '@/components/teacherAssignments/teacherAssignmentLabels';
import { useClassSections } from '@/hooks/useClassSections';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeacherAssignments } from '@/hooks/useTeacherAssignments';
import { useTeachers } from '@/hooks/useTeachers';
import { deleteTeacherAssignment, type TeacherAssignment } from '@/services/teacherAssignments.service';

// Solapa "Asignación docente" de CoursesPage. Vive dentro del Paper de la página,
// por eso no trae MainLayout, PageHeader ni fondo propio.
export const TeacherAssignmentsTab = () => {
  const notify = useNotify();
  const q = useTeacherAssignments();
  const { teachers, loading: loadingTeachers, error: teachersError } = useTeachers();
  const { subjects, loading: loadingSubjects, error: subjectsError } = useSubjects();
  const { sections, loading: loadingSections, error: sectionsError } = useClassSections();

  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [year, setYear] = useState(''); // ciclo lectivo
  const [grade, setGrade] = useState(''); // año de cursada
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<TeacherAssignment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Ciclos lectivos que aparecen en las asignaciones, del más nuevo al más viejo.
  // Se conserva el elegido aunque ya no tenga asignaciones, para que el select no quede vacío.
  const years = useMemo(() => {
    const set = new Set(q.assignments.map((a) => a.classSection.academicYear.year));
    if (year) set.add(Number(year));
    return Array.from(set).sort((a, b) => b - a);
  }, [q.assignments, year]);

  // El back solo filtra por docente, materia y curso: ciclo lectivo y año de cursada se filtran acá
  const filtered = useMemo(
    () =>
      q.assignments.filter((a) => {
        if (year && a.classSection.academicYear.year !== Number(year)) return false;
        if (teacherId && a.teacherId !== teacherId) return false;
        if (subjectId && a.subjectId !== subjectId) return false;
        if (grade && a.classSection.grade !== Number(grade)) return false;
        return true;
      }),
    [q.assignments, year, teacherId, subjectId, grade],
  );

  // Si al quitar una asignación la página actual queda vacía, volvemos a la última con datos
  const lastPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
  const safePage = Math.min(page, lastPage);
  const visible = filtered.slice(safePage * rowsPerPage, (safePage + 1) * rowsPerPage);

  const errors = [
    q.error,
    teachersError && `No se pudieron cargar los docentes: ${teachersError}`,
    subjectsError && `No se pudieron cargar las materias: ${subjectsError}`,
    sectionsError && `No se pudieron cargar los cursos: ${sectionsError}`,
  ].filter((message): message is string => !!message);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteTeacherAssignment(toDelete.id);
      notify.success('Asignación quitada');
      setToDelete(null);
      q.reload();
    } catch (e) {
      notify.error(getAssignmentErrorMessage(e, 'No se pudo quitar la asignación'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, borderBottom: '1px solid #f3f4f6' }}>
        <AddButton label="Asignar docente" onClick={() => setFormOpen(true)} />
      </Box>

      <TeacherAssignmentFilters
        teachers={teachers}
        subjects={subjects}
        years={years}
        teacherId={teacherId}
        subjectId={subjectId}
        year={year}
        grade={grade}
        onTeacherChange={(v) => {
          setTeacherId(v);
          setPage(0);
        }}
        onSubjectChange={(v) => {
          setSubjectId(v);
          setPage(0);
        }}
        onYearChange={(v) => {
          setYear(v);
          setPage(0);
        }}
        onGradeChange={(v) => {
          setGrade(v);
          setPage(0);
        }}
      />

      {errors.map((message) => (
        <Alert key={message} severity="error" sx={{ mx: 2, mb: 2 }}>
          {message}
        </Alert>
      ))}

      <TeacherAssignmentsTable
        assignments={visible}
        total={filtered.length}
        loading={q.loading}
        page={safePage}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(rows) => {
          setRowsPerPage(rows);
          setPage(0);
        }}
        onDelete={setToDelete}
      />

      <TeacherAssignmentFormDialog
        open={formOpen}
        teachers={teachers}
        subjects={subjects}
        sections={sections}
        loadingOptions={loadingTeachers || loadingSubjects || loadingSections}
        onClose={() => setFormOpen(false)}
        onSaved={q.reload}
      />

      <DeleteTeacherAssignmentDialog
        open={!!toDelete}
        assignment={toDelete}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </Box>
  );
};

export default TeacherAssignmentsTab;