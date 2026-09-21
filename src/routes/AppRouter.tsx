// src/routes/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import StudentsPage from '@/pages/StudentsPage'; // nuevo

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

        {/* Redirección por defecto al Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;