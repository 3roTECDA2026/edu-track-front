// src/routes/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import CursosPage from '../pages/CursosPage'; 

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard principal */}
        <Route path="/home" element={<HomePage />} />

        {/* Estructura institucional / Cursos */}
        <Route path="/cursos" element={<CursosPage />} />

        {/* Redirección por defecto al Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;