import { MenuItem, Stack, TextField } from '@mui/material';
import type { SubjectOption } from '@/services/subjects.service';
import type { TeacherSummary } from '@/services/teacherAssignments.service';
import { GRADES, getTeacherName } from '@/components/teacherAssignments/teacherAssignmentLabels';

interface TeacherAssignmentFiltersProps {
  teachers: TeacherSummary[];
  subjects: SubjectOption[];
  years: number[]; // ciclos lectivos presentes en las asignaciones
  teacherId: string;
  subjectId: string;
  year: string; // '' = todos
  grade: string; // '' = todos, '1'..'6'
  onTeacherChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onGradeChange: (value: string) => void;
}

export const TeacherAssignmentFilters = ({
  teachers,
  subjects,
  years,
  teacherId,
  subjectId,
  year,
  grade,
  onTeacherChange,
  onSubjectChange,
  onYearChange,
  onGradeChange,
}: TeacherAssignmentFiltersProps) => {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2 }}>
      <TextField
        select
        size="small"
        label="Docente"
        value={teacherId}
        fullWidth
        onChange={(e) => onTeacherChange(e.target.value)}
      >
        <MenuItem value="">Todos los docentes</MenuItem>
        {teachers.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {getTeacherName(t)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Materia"
        value={subjectId}
        fullWidth
        onChange={(e) => onSubjectChange(e.target.value)}
      >
        <MenuItem value="">Todas las materias</MenuItem>
        {subjects.map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {s.name} ({s.gradeLevel}° año)
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Ciclo lectivo"
        value={year}
        sx={{ minWidth: 180 }}
        onChange={(e) => onYearChange(e.target.value)}
      >
        <MenuItem value="">Todos los ciclos</MenuItem>
        {years.map((y) => (
          <MenuItem key={y} value={String(y)}>
            {y}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Año de cursada"
        value={grade}
        sx={{ minWidth: 180 }}
        onChange={(e) => onGradeChange(e.target.value)}
      >
        <MenuItem value="">Todos los años</MenuItem>
        {GRADES.map((g) => (
          <MenuItem key={g} value={String(g)}>
            {g}° año
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
};