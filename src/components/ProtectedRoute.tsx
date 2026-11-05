// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { hasRole } from '../utils/auth';

interface Props {
  roles: string[];
  children: ReactNode;
}

export default function ProtectedRoute({ roles, children }: Props) {
  if (!hasRole(roles)) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}