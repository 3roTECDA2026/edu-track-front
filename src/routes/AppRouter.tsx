// src/routes/AppRouter.tsx
import ConflictsPage from '@/pages/ConflictsPage'
import { CONFLICT_ALLOWED_ROLES } from '@/components/conflicts/ConflictRoleGuard'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import UsersPage from '@/pages/UsersPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import AttendanceSummaryPage from '@/pages/AttendanceSummaryPage'
import DailyAttendancePage from '@/pages/DailyAttendancePage'
import StudentsPage from '@/pages/StudentsPage'
import CalificationGridPage from '@/pages/CalificationGridPage'
import CoursesPage from '@/pages/CoursesPage'
import StudentProfilePage from '@/pages/StudentProfilePage'
import StudentTrajectoryPage from '@/pages/StudentTrajectoryPage'
import IntensificationCalendarPage from '@/pages/IntensificationCalendarPage'
import OrganizationalModelPage from '@/pages/OrganizationalModelPage'
import InterventionFormPage from '@/pages/InterventionFormPage'
import EdteMeetingsPage from '@/pages/EdteMeetingsPage'
import EdteMeetingFormPage from '@/pages/EdteMeetingFormPage'
import EdteMeetingDetailPage from '@/pages/EdteMeetingDetailPage'
import { EDTE_MANAGER_ROLES, EDTE_VIEWER_ROLES } from '@/components/edte/edteLabels'
import EdteDashboardPage from '@/pages/EdteDashboardPage'
import { EDTE_DASHBOARD_ROLES } from '@/components/edteDashboard/dashboardLabels'
import EdteReferralsPage from '@/pages/EdteReferralsPage'
import { EDTE_REFERRALS_ROLES } from '@/components/edteReferrals/referralLabels'
import PromotionPage from '@/pages/PromotionPage'
import { ADMIN_ROLES, USER_MANAGEMENT_ROLES } from '@/services/session'
import { AcademicYearsProvider } from '@/hooks/useAcademicYears'
import ProtectedRoute from '@/routes/ProtectedRoute'

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Privadas: requieren sesión */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/attendance" element={<AttendanceSummaryPage />} />
          <Route path="/attendance/daily" element={<DailyAttendancePage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/:id" element={<StudentProfilePage />} />
          <Route path="/students/:id/trajectory" element={<StudentTrajectoryPage />} />
          <Route path="/calification-grid" element={<CalificationGridPage />} />
          <Route path="/intensification-calendar" element={<IntensificationCalendarPage />} />
          <Route path="/organizational-model" element={<OrganizationalModelPage />} />
          <Route path="/interventions/new" element={<InterventionFormPage />} />
        </Route>

        {/* Reuniones del EDTE (CRM-075): listado y detalle, solo el personal de la escuela */}
        <Route element={<ProtectedRoute roles={EDTE_VIEWER_ROLES} />}>
          <Route path="/edte-meetings" element={<EdteMeetingsPage />} />
          <Route path="/edte-meetings/:id" element={<EdteMeetingDetailPage />} />
        </Route>

        {/* Reuniones del EDTE: alta y edición, solo quienes gestionan */}
        <Route element={<ProtectedRoute roles={EDTE_MANAGER_ROLES} />}>
          <Route path="/edte-meetings/new" element={<EdteMeetingFormPage />} />
          <Route path="/edte-meetings/:id/edit" element={<EdteMeetingFormPage />} />
        </Route>

        {/* Dashboard del EDTE (CRM-077): EOE y dirección */}
        <Route element={<ProtectedRoute roles={EDTE_DASHBOARD_ROLES} />}>
          <Route path="/edte-dashboard" element={<EdteDashboardPage />} />
        </Route>

        {/* Promoción: administración y dirección */}
        <Route element={<ProtectedRoute roles={ADMIN_ROLES} />}>
          <Route
            path="/promotion"
            element={
              <AcademicYearsProvider>
                <PromotionPage />
              </AcademicYearsProvider>
            }
          />
        </Route>

        {/* Solo administración */}
        {/* Derivados al EDTE (CRM-074): solo EOE y dirección */}
        <Route element={<ProtectedRoute roles={EDTE_REFERRALS_ROLES} />}>
          <Route path="/edte-referrals" element={<EdteReferralsPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={USER_MANAGEMENT_ROLES} />}>
          <Route path="/users" element={<UsersPage />} />
        </Route>

        {/* CRM-091/092: acceso exclusivo a EOE y Directivos */}
        <Route element={<ProtectedRoute roles={CONFLICT_ALLOWED_ROLES} />}>
          <Route path="/conflicts" element={<ConflictsPage />} />
        </Route>

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
