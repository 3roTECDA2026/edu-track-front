import { useMemo, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { AddButton } from '@/components/common/AddButton';
import { ContentCard } from '@/components/common/ContentCard';
import { PageHeader } from '@/components/common/PageHeader';
import MainLayout from '@/components/layout/MainLayout';
import { useNotify } from '@/components/layout/NotificationProvider';
import { DeleteTeacherAssignmentDialog } from '@/components/teacherAssignments/DeleteTeacherAssignmentDialog';
import { TeacherAssignmentFilters } from '@/components/teacherAssignments/TeacherAssignmentFilters';
import { TeacherAssignmentFormDialog } from '@/components/teacherAssignments/TeacherAssignmentFormDialog';
import { TeacherAssignmentsTable } from '@/components/teacherAssignments/TeacherAssignmentsTable';
import { getAssignmentErrorMessage } from '@/components/teacherAssignments/teacherAssignmentLabels';
import { useAcademicYears } from '@/hooks/useAcademicYears';
import { useClassSections } from '@/hooks/useClassSections';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeacherAssignments } from '@/hooks/useTeacherAssignments';
import { useTeachers } from '@/hooks/useTeachers';
import { deleteTeacherAssignment, type TeacherAssignment } from '@/services/teacherAssignments.service';

const TeacherAssignmentsContent = () => {
  const notify = useNotify();
  const { selectedYear } = useAcademicYears();
  const q = useTeacherAssignments();
  const { teachers, loading: loadingTeachers, error: teachersError } = useTeachers();
  const { subjects, loading: loadingSubjects, error: subjectsError } = useSubjects();
  const { sections, loading: loadingSections, error: sectionsError } = useClassSections();

  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [grade, setGrade] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<TeacherAssignment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // El back solo filtra por docente, materia y curso: ciclo lectivo y año de cursada se filtran acá
  const filtered = useMemo(
    () =>
      q.assignments.filter((a) => {
        if (selectedYear !== undefined && a.classSection.academicYear.year !== selectedYear) return false;
        if (teacherId && a.teacherId !== teacherId) return false;
        if (subjectId && a.subjectId !== subjectId) return false;
        if (grade && a.classSection.grade !== Number(grade)) return false;
        return true;
      }),
    [q.assignments, selectedYear, teacherId, subjectId, grade],
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
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f4f4f4', minHeight: '100%' }}>
      <PageHeader
        title="Asignación de docentes"
        subtitle={
          selectedYear !== undefined
            ? `Docentes por materia y curso del ciclo lectivo ${selectedYear}`
            : 'Docentes por materia y curso'
        }
        breadcrumbs={[{ label: 'Inicio', href: '/home' }, { label: 'Asignación de docentes' }]}
        action={<AddButton label="Asignar docente" onClick={() => setFormOpen(true)} />}
      />

      <ContentCard>
        <TeacherAssignmentFilters
          teachers={teachers}
          subjects={subjects}
          teacherId={teacherId}
          subjectId={subjectId}
          grade={grade}
          onTeacherChange={(v) => {
            setTeacherId(v);
            setPage(0);
          }}
          onSubjectChange={(v) => {
            setSubjectId(v);
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
      </ContentCard>

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

// useAcademicYears necesita su provider; el contenido va en un componente aparte
// por si ese provider vive dentro de MainLayout.
const TeacherAssignmentsPage = () => (
  <MainLayout>
    <TeacherAssignmentsContent />
  </MainLayout>
);

export default TeacherAssignmentsPage;
