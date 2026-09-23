// src/routes/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';

import AttendanceSummaryPage from '@/pages/AttendanceSummaryPage';
import StudentsPage from '@/pages/StudentsPage';
import GrillaCalificacionesPage from '@/pages/GrillaCalificacionesPage';
import NewStudentPage from '@/pages/NewStudentPage';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard principal */}
        <Route path="/home" element={<HomePage />} />


        {/* Resumen de inasistencias */}
        <Route path="/attendance" element={<AttendanceSummaryPage />} />

        {/* Listado de estudiantes */}
        <Route path="/students" element={<StudentsPage />} /> {/* nuevo */}

        {/* Formulario para crear un nuevo estudiante */}
        <Route path="/students/new" element={<NewStudentPage />} />

        {/* Carga de calificaciones */}
        <Route path="/calificaciones" element={<GrillaCalificacionesPage />} />


        {/* Redirección por defecto al Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;