// src/routes/AppRouter.tsx
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
import EdteMembersPage from '@/pages/EdteMembersPage'
import OrganizationalModelPage from '@/pages/OrganizationalModelPage'
import { USER_MANAGEMENT_ROLES } from '@/services/session'
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
          <Route path="/edte-members" element={<EdteMembersPage />} />
        </Route>

        {/* Solo administración */}
        <Route element={<ProtectedRoute roles={USER_MANAGEMENT_ROLES} />}>
       <Route path="/users" element={<UsersPage />} />
      </Route>

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
