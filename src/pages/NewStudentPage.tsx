import MainLayout from '@/components/layout/MainLayout';
import { StudentForm } from '@/components/students/StudentForm';

export default function NewStudentPage() {
  return (
    <MainLayout>
      <StudentForm />
    </MainLayout>
  );
}