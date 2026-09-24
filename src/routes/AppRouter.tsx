// src/routes/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UsersPage from '@/pages/UsersPage';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import AttendanceSummaryPage from '@/pages/AttendanceSummaryPage';
import StudentsPage from '@/pages/StudentsPage';
import GrillaCalificacionesPage from '@/pages/GrillaCalificacionesPage';
import CursosPage from '@/pages/CursosPage'; 
import NewStudentPage from '@/pages/NewStudentPage';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de Login */}
        <Route path="/login" element={<LoginPage />} />
        {/* Dashboard principal */}
        <Route path="/home" element={<HomePage />} />
        {/* Secciones generales */}
<!--         <Route path="/students" element={<StudentsPage />} /> -->
        <Route path="/courses" element={<CoursesPage />} />
<!--         <Route path="/attendance" element={<AttendancePage />} /> -->
        {/* Resumen de inasistencias */}
        <Route path="/attendance" element={<AttendanceSummaryPage />} />
        {/* Estructura institucional / Cursos */}
<!--         <Route path="/cursos" element={<CursosPage />} /> -->
        {/* Listado de estudiantes */}
        <Route path="/students" element={<StudentsPage />} />
        {/* Formulario para crear un nuevo estudiante */}
        <Route path="/students/new" element={<NewStudentPage />} />
        {/* Carga de calificaciones */}
        <Route path="/calificaciones" element={<GrillaCalificacionesPage />} />
        
        {/* Administración de usuarios */}
        <Route path="/users" element={<UsersPage />} />

        {/* Redirección por defecto al Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;