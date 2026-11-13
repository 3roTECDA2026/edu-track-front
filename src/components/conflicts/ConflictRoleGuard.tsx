import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { currentUser } from '@/utils/currentUser'

export const CONFLICT_ALLOWED_ROLES = [
  'EOE_DIRECTIVE',
  'SCHOOL_MANAGEMENT',
]

export function canAccessConflicts(role: string | null): boolean {
  return role !== null && CONFLICT_ALLOWED_ROLES.includes(role)
}

interface ConflictRoleGuardProps {
  children: ReactNode
}

export function ConflictRoleGuard({ children }: ConflictRoleGuardProps) {
  const { role } = currentUser()

  if (!canAccessConflicts(role)) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}
