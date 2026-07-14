import api from './api';

/**
 * DOCTOR SERVICE
 * Handles all doctor-related API calls.
 *
 * Backend endpoints expected:
 *   GET    /doctors             — list all doctors
 *   GET    /doctors/:id         — get single doctor
 *   POST   /doctors             — add new doctor
 *   PUT    /doctors/:id         — update doctor record
 *   DELETE /doctors/:id         — remove doctor
 *   PATCH  /doctors/:id/status  — update availability status
 */

/**
 * Fetch all doctors with optional filters.
 * @param {object} [params]
 * @param {string} [params.search]       — search by name or specialization
 * @param {string} [params.department]   — filter by department
 * @param {string} [params.availability] — 'On Duty' | 'Off Duty' | 'On Leave'
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<{ doctors: object[], total: number }>}
 */
export const getAllDoctors = (params = {}) =>
  api.get('/doctors', { params });

/**
 * Fetch a single doctor by ID.
 * @param {string} id — doctor ID
 * @returns {Promise<object>} full doctor profile
 */
export const getDoctorById = (id) =>
  api.get(`/doctors/${id}`);

/**
 * Add a new doctor to the system.
 * @param {object} doctorData
 * @param {string} doctorData.name
 * @param {string} doctorData.spec         — specialization
 * @param {string} doctorData.dept         — department
 * @param {string} doctorData.phone
 * @param {string} doctorData.email
 * @param {string} doctorData.avail        — 'On Duty' | 'Off Duty' | 'On Leave'
 * @returns {Promise<{ doctor: object, message: string }>}
 */
export const addDoctor = (doctorData) =>
  api.post('/doctors', doctorData);

/**
 * Update an existing doctor's record.
 * @param {string} id          — doctor ID
 * @param {object} updatedData — partial update allowed
 * @returns {Promise<{ doctor: object, message: string }>}
 */
export const updateDoctor = (id, updatedData) =>
  api.put(`/doctors/${id}`, updatedData);

/**
 * Remove a doctor from the system.
 * @param {string} id — doctor ID
 * @returns {Promise<{ message: string }>}
 */
export const deleteDoctor = (id) =>
  api.delete(`/doctors/${id}`);

/**
 * Quickly update only a doctor's availability status.
 * @param {string} id     — doctor ID
 * @param {string} status — 'On Duty' | 'Off Duty' | 'On Leave'
 * @returns {Promise<{ doctor: object, message: string }>}
 */
export const updateDoctorStatus = (id, status) =>
  api.patch(`/doctors/${id}/status`, { availability: status });
