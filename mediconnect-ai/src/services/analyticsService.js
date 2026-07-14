import api from './api';

/**
 * ANALYTICS SERVICE
 * Handles all analytics & reporting API calls.
 *
 * Backend endpoints expected:
 *   GET  /analytics/summary          — KPI stats (patients, appointments, etc.)
 *   GET  /analytics/patient-trend    — monthly patient registration trend
 *   GET  /analytics/appointments     — appointments by department
 *   GET  /analytics/notifications    — notification channel distribution
 *   GET  /analytics/messages         — weekly message volume
 *   GET  /analytics/doctors          — doctor availability breakdown
 *   GET  /analytics/export           — export full report as PDF/CSV
 */

/**
 * Fetch top-level KPI summary cards.
 * @param {object} [params]
 * @param {string} [params.range] — '7d' | '30d' | '3m' | '1y'  (default: '30d')
 * @returns {Promise<{
 *   messagesSent:        { value: number, change: string },
 *   appointments:        { value: number, change: string },
 *   patientsRegistered:  { value: number, change: string },
 *   doctorsAvailable:    { value: number, total: number  },
 * }>}
 */
export const getAnalyticsSummary = (params = {}) =>
  api.get('/analytics/summary', { params });

/**
 * Monthly patient registration, discharge & readmission trend.
 * @param {object} [params]
 * @param {string} [params.year]  — e.g., "2025"
 * @param {string} [params.range] — '3m' | '6m' | '1y'
 * @returns {Promise<Array<{ month: string, registered: number, discharged: number, readmitted: number }>>}
 */
export const getPatientTrend = (params = {}) =>
  api.get('/analytics/patient-trend', { params });

/**
 * Appointments breakdown per department.
 * @param {object} [params]
 * @param {string} [params.range]
 * @returns {Promise<Array<{ dept: string, appointments: number, completed: number, cancelled: number }>>}
 */
export const getAppointmentsByDept = (params = {}) =>
  api.get('/analytics/appointments', { params });

/**
 * Notification channel distribution (for pie chart).
 * @param {object} [params]
 * @param {string} [params.range]
 * @returns {Promise<Array<{ name: string, value: number, color: string }>>}
 */
export const getNotificationChannelStats = (params = {}) =>
  api.get('/analytics/notifications', { params });

/**
 * Weekly message volume (sent, delivered, failed) for area chart.
 * @param {object} [params]
 * @param {string} [params.weeks] — number of weeks to include (default: 7)
 * @returns {Promise<Array<{ week: string, sent: number, delivered: number, failed: number }>>}
 */
export const getWeeklyMessages = (params = {}) =>
  api.get('/analytics/messages', { params });

/**
 * Doctor availability breakdown (for radial chart).
 * @returns {Promise<Array<{ name: string, value: number, fill: string }>>}
 */
export const getDoctorAvailability = () =>
  api.get('/analytics/doctors');

/**
 * Export a full analytics report as PDF or CSV.
 * @param {object} [params]
 * @param {string} [params.format] — 'pdf' | 'csv' (default: 'pdf')
 * @param {string} [params.range]
 * @returns {Promise<Blob>} — use with URL.createObjectURL() to trigger download
 */
export const exportAnalyticsReport = (params = {}) =>
  api.get('/analytics/export', {
    params,
    responseType: 'blob',   // important for file downloads
  });
