// src/routes/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UsersPage from '@/pages/UsersPage';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import AttendanceSummaryPage from '@/pages/AttendanceSummaryPage';
import StudentsPage from '@/pages/StudentsPage';
import CalificationGridPage from '@/pages/CalificationGridPage';
import CoursesPage from '@/pages/CoursesPage';
import NewStudentPage from '@/pages/NewStudentPage';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de Login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        {/* Resumen de inasistencias */}
        <Route path="/attendance" element={<AttendanceSummaryPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/new" element={<NewStudentPage />} />
        {/* Carga de calificaciones */}
        <Route path="/calification-grid" element={<CalificationGridPage />} />
        {/* Administración de usuarios */}
        <Route path="/users" element={<UsersPage />} />
        {/* Redirección por defecto al Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;