import api from './api';

/**
 * PATIENT SERVICE
 * Handles all patient-related API calls.
 *
 * Backend endpoints expected:
 *   GET    /patients               — list all patients (with filters)
 *   GET    /patients/:id           — get single patient
 *   POST   /patients               — register new patient
 *   PUT    /patients/:id           — update patient record
 *   DELETE /patients/:id           — delete patient
 *   GET    /patients/:id/history   — patient appointment history
 */

/**
 * Register a new patient.
 * @param {object} patientData
 * @param {string} patientData.firstName
 * @param {string} patientData.lastName
 * @param {number} patientData.age
 * @param {string} patientData.gender          — 'Male' | 'Female' | 'Other'
 * @param {string} patientData.phone
 * @param {string} patientData.email
 * @param {string} patientData.address
 * @param {string} patientData.disease
 * @param {string} patientData.doctorAssigned  — doctor ID or name
 * @param {string} patientData.appointmentDate — ISO date string
 * @param {string} patientData.preferredLanguage
 * @param {string} patientData.notificationMethod — 'sms' | 'email' | 'whatsapp' | 'call'
 * @returns {Promise<{ patient: object, message: string }>}
 */
export const registerPatient = (patientData) =>
  api.post('/patients', patientData);

/**
 * Fetch all patients with optional filters.
 * @param {object} [params]
 * @param {string} [params.search]   — search by name or ID
 * @param {string} [params.disease]  — filter by disease
 * @param {string} [params.status]   — 'Active' | 'Recovered' | 'Critical'
 * @param {string} [params.doctor]   — filter by assigned doctor ID
 * @param {number} [params.page]     — pagination page (default: 1)
 * @param {number} [params.limit]    — results per page (default: 20)
 * @returns {Promise<{ patients: object[], total: number, page: number }>}
 */
export const getAllPatients = (params = {}) =>
  api.get('/patients', { params });

/**
 * Fetch a single patient by ID.
 * @param {string} id — patient ID (e.g., "P-1042")
 * @returns {Promise<object>} full patient object
 */
export const getPatientById = (id) =>
  api.get(`/patients/${id}`);

/**
 * Update an existing patient's record.
 * @param {string} id           — patient ID
 * @param {object} updatedData  — fields to update (partial allowed)
 * @returns {Promise<{ patient: object, message: string }>}
 */
export const updatePatient = (id, updatedData) =>
  api.put(`/patients/${id}`, updatedData);

/**
 * Delete a patient record permanently.
 * @param {string} id — patient ID
 * @returns {Promise<{ message: string }>}
 */
export const deletePatient = (id) =>
  api.delete(`/patients/${id}`);

/**
 * Get a patient's full appointment history.
 * @param {string} id — patient ID
 * @returns {Promise<{ appointments: object[] }>}
 */
export const getPatientHistory = (id) =>
  api.get(`/patients/${id}/history`);
