import api from './api';

/**
 * APPOINTMENT SERVICE
 * Handles all appointment-related API calls.
 *
 * Backend endpoints expected:
 *   GET    /appointments          — list all appointments
 *   GET    /appointments/:id      — get single appointment
 *   POST   /appointments          — book a new appointment
 *   PUT    /appointments/:id      — update appointment details
 *   PATCH  /appointments/:id/cancel — cancel an appointment
 *   DELETE /appointments/:id      — delete appointment record
 */

/**
 * Book a new appointment.
 * @param {object} appointmentData
 * @param {string} appointmentData.patient         — patient name or ID
 * @param {string} appointmentData.doctor          — doctor name or ID
 * @param {string} appointmentData.dept            — department
 * @param {string} appointmentData.date            — ISO date string (YYYY-MM-DD)
 * @param {string} appointmentData.time            — time slot (e.g., "09:00 AM")
 * @param {string} appointmentData.reason          — reason for visit
 * @param {string} appointmentData.priority        — 'Low' | 'Medium' | 'High' | 'Critical'
 * @returns {Promise<{ appointment: object, message: string }>}
 */
export const bookAppointment = (appointmentData) =>
  api.post('/appointments', appointmentData);

/**
 * Fetch all appointments with optional filters.
 * @param {object} [params]
 * @param {string} [params.search]    — search by patient, doctor, or ID
 * @param {string} [params.status]    — 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed'
 * @param {string} [params.priority]  — 'Low' | 'Medium' | 'High' | 'Critical'
 * @param {string} [params.date]      — filter by specific date (YYYY-MM-DD)
 * @param {string} [params.doctor]    — filter by doctor ID
 * @param {string} [params.dept]      — filter by department
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<{ appointments: object[], total: number }>}
 */
export const getAllAppointments = (params = {}) =>
  api.get('/appointments', { params });

/**
 * Fetch a single appointment by ID.
 * @param {string} id — appointment ID (e.g., "APT-1001")
 * @returns {Promise<object>}
 */
export const getAppointmentById = (id) =>
  api.get(`/appointments/${id}`);

/**
 * Update appointment details (reschedule, change doctor, etc.).
 * @param {string} id          — appointment ID
 * @param {object} updatedData — partial update (date, time, doctor, etc.)
 * @returns {Promise<{ appointment: object, message: string }>}
 */
export const updateAppointment = (id, updatedData) =>
  api.put(`/appointments/${id}`, updatedData);

/**
 * Cancel an appointment (soft delete — sets status to Cancelled).
 * @param {string} id     — appointment ID
 * @param {string} [reason] — optional cancellation reason
 * @returns {Promise<{ message: string }>}
 */
export const cancelAppointment = (id, reason = '') =>
  api.patch(`/appointments/${id}/cancel`, { reason });

/**
 * Permanently delete an appointment record.
 * @param {string} id — appointment ID
 * @returns {Promise<{ message: string }>}
 */
export const deleteAppointment = (id) =>
  api.delete(`/appointments/${id}`);
