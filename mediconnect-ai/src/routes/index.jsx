import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Guards
import MainLayout       from '../components/layout/MainLayout';
import ProtectedRoute   from '../components/common/ProtectedRoute';

// Pages
import Login                from '../pages/Login';
import Dashboard            from '../pages/Dashboard';
import PatientRegistration  from '../pages/PatientRegistration';
import DoctorManagement     from '../pages/DoctorManagement';
import AppointmentBooking   from '../pages/AppointmentBooking';
import AiNotifications      from '../pages/AiNotifications';
import NotificationHistory  from '../pages/NotificationHistory';
import Analytics            from '../pages/Analytics';
import Settings             from '../pages/Settings';
import NotFound             from '../pages/NotFound';

// Route constants
import { ROUTES } from '../utils/constants';

const AppRoutes = () => {
  return (
    <Routes>
      {/* ── Public Routes ──────────────────────────────────────────── */}
      <Route path={ROUTES.HOME}  element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />

      {/* ── Protected Routes (require login) ──────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.DASHBOARD}        element={<Dashboard />} />
          <Route path={ROUTES.PATIENTS}         element={<PatientRegistration />} />
          <Route path={ROUTES.DOCTORS}          element={<DoctorManagement />} />
          <Route path={ROUTES.APPOINTMENTS}     element={<AppointmentBooking />} />
          <Route path={ROUTES.AI_NOTIFICATIONS} element={<AiNotifications />} />
          <Route path={ROUTES.NOTIFICATIONS}    element={<NotificationHistory />} />
          <Route path={ROUTES.ANALYTICS}        element={<Analytics />} />
          <Route path={ROUTES.SETTINGS}         element={<Settings />} />
        </Route>
      </Route>


      {/* ── 404 Fallback ───────────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
