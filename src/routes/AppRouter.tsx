// src/routes/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import StudentsPage from '@/pages/StudentsPage'; // nuevo
import GrillaCalificacionesPage from '../pages/GrillaCalificacionesPage';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard principal */}
        <Route path="/home" element={<HomePage />} />

        {/* Listado de estudiantes */}
        <Route path="/students" element={<StudentsPage />} /> {/* nuevo */}

        {/* Carga de calificaciones */}
        <Route path="/calificaciones" element={<GrillaCalificacionesPage />} />

        {/* Redirección por defecto al Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;