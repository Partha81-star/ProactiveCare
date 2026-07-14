/**
 * SERVICES — Barrel Export
 *
 * Import any API function from a single location:
 *
 * Usage:
 *   import { loginUser, registerPatient, bookAppointment } from '../services';
 *
 * Or import a full service:
 *   import { patientService } from '../services';
 *   patientService.registerPatient(data);
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────
export * as authService from './authService';
export {
  loginUser,
  logoutUser,
  getProfile,
  refreshToken,
  forgotPassword,
  resetPassword,
} from './authService';

// ─── Patients ─────────────────────────────────────────────────────────────────
export * as patientService from './patientService';
export {
  registerPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getPatientHistory,
} from './patientService';

// ─── Doctors ──────────────────────────────────────────────────────────────────
export * as doctorService from './doctorService';
export {
  getAllDoctors,
  getDoctorById,
  addDoctor,
  updateDoctor,
  deleteDoctor,
  updateDoctorStatus,
} from './doctorService';

// ─── Appointments ─────────────────────────────────────────────────────────────
export * as appointmentService from './appointmentService';
export {
  bookAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  deleteAppointment,
} from './appointmentService';

// ─── Notifications ────────────────────────────────────────────────────────────
export * as notificationService from './notificationService';
export {
  getAllNotifications,
  getNotificationById,
  sendNotification,
  resendNotification,
  markAsRead,
  markAllAsRead,
  getNotificationStats,
} from './notificationService';

// ─── Analytics ────────────────────────────────────────────────────────────────
export * as analyticsService from './analyticsService';
export {
  getAnalyticsSummary,
  getPatientTrend,
  getAppointmentsByDept,
  getNotificationChannelStats,
  getWeeklyMessages,
  getDoctorAvailability,
  exportAnalyticsReport,
} from './analyticsService';
