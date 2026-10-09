import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Layout & Guards
import MainLayout       from '../components/layout/MainLayout';
import ProtectedRoute   from '../components/common/ProtectedRoute';

// Pages
import Login                from '../pages/Login';
const Dashboard = lazy(() => import('../pages/Dashboard'));
const PatientRegistration = lazy(() => import('../pages/PatientRegistration'));
const DoctorManagement = lazy(() => import('../pages/DoctorManagement'));
const AppointmentBooking = lazy(() => import('../pages/AppointmentBooking'));
const AiNotifications = lazy(() => import('../pages/AiNotifications'));
const NotificationHistory = lazy(() => import('../pages/NotificationHistory'));
const Analytics = lazy(() => import('../pages/Analytics'));
const Settings = lazy(() => import('../pages/Settings'));
import NotFound             from '../pages/NotFound';

// Route constants
import { ROUTES } from '../utils/constants';

const AppRoutes = () => {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">Loading page…</div>}>
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
    </Suspense>
  );
};

export default AppRoutes;
