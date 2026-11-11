import { Navigate, Outlet } from 'react-router-dom';
import { getRole, getToken } from '@/services/session';

interface ProtectedRouteProps {
  roles?: string[]; // si no se define, alcanza con tener sesión
}

export const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  if (roles) {
    const role = getRole();
    if (!role || !roles.includes(role)) {
      return <Navigate to="/home" replace />;
    }
  }
  return <Outlet />;
};

export default ProtectedRoute;
