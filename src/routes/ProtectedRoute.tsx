import { Navigate, Outlet } from 'react-router-dom';
import { getToken } from '@/services/session';

export const ProtectedRoute = () => {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;