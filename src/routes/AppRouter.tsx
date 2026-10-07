// src/routes/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import UsersPage from '@/pages/UsersPage';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import AttendanceSummaryPage from '@/pages/AttendanceSummaryPage';
import StudentsPage from '@/pages/StudentsPage';
import CalificationGridPage from '@/pages/CalificationGridPage';
import CoursesPage from '@/pages/CoursesPage';
import StudentProfilePage from '@/pages/StudentProfilePage';
import StudentTrajectoryPage from '@/pages/StudentTrajectoryPage';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Inicio */}
        <Route path="/home" element={<HomePage />} />

        {/* Cursos */}
        <Route path="/courses" element={<CoursesPage />} />

        {/* Asistencia */}
        <Route path="/attendance" element={<AttendanceSummaryPage />} />

        {/* Alumnos */}
        <Route path="/students" element={<StudentsPage />} />

        {/* Ficha del alumno */}
        <Route path="/students/:id" element={<StudentProfilePage />} />

        {/* Trayectoria académica del alumno */}
        <Route
          path="/students/:id/trajectory"
          element={<StudentTrajectoryPage />}
        />

        {/* Calificaciones */}
        <Route
          path="/calification-grid"
          element={<CalificationGridPage />}
        />

        {/* Usuarios */}
        <Route path="/users" element={<UsersPage />} />

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;