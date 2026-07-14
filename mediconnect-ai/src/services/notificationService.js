import api from './api';

/**
 * NOTIFICATION SERVICE
 * Handles all notification-related API calls.
 *
 * Backend endpoints expected:
 *   GET    /notifications              — list notification history
 *   GET    /notifications/:id          — get single notification
 *   POST   /notifications/send         — send a new notification
 *   POST   /notifications/:id/resend   — resend a failed notification
 *   PATCH  /notifications/:id/read     — mark single notification as read
 *   PATCH  /notifications/mark-all-read — mark all as read
 *   GET    /notifications/stats        — delivery statistics
 */

/**
 * Fetch all notification logs with optional filters.
 * @param {object} [params]
 * @param {string} [params.search]   — search by patient name or type
 * @param {string} [params.type]     — filter by notification type
 * @param {string} [params.channel]  — 'SMS' | 'Email' | 'WhatsApp' | 'Phone Call'
 * @param {string} [params.status]   — 'Delivered' | 'Pending' | 'Failed'
 * @param {string} [params.date]     — filter by date (YYYY-MM-DD)
 * @param {number} [params.page]     — default: 1
 * @param {number} [params.limit]    — default: 10
 * @returns {Promise<{ notifications: object[], total: number, page: number }>}
 */
export const getAllNotifications = (params = {}) =>
  api.get('/notifications', { params });

/**
 * Fetch a single notification by ID.
 * @param {string} id — notification ID (e.g., "NID-3001")
 * @returns {Promise<object>}
 */
export const getNotificationById = (id) =>
  api.get(`/notifications/${id}`);

/**
 * Send a new notification to a patient.
 * @param {object} notifData
 * @param {string} notifData.patientId          — recipient patient ID
 * @param {string} notifData.type               — notification type
 * @param {string} notifData.channel            — 'SMS' | 'Email' | 'WhatsApp' | 'Phone Call'
 * @param {string} notifData.message            — notification message body
 * @param {string} [notifData.scheduledAt]      — optional ISO datetime to schedule
 * @returns {Promise<{ notification: object, message: string }>}
 */
export const sendNotification = (notifData) =>
  api.post('/notifications/send', notifData);

/**
 * Resend a failed notification.
 * @param {string} id — notification ID
 * @returns {Promise<{ notification: object, message: string }>}
 */
export const resendNotification = (id) =>
  api.post(`/notifications/${id}/resend`);

/**
 * Mark a single notification as read.
 * @param {string} id — notification ID
 * @returns {Promise<{ message: string }>}
 */
export const markAsRead = (id) =>
  api.patch(`/notifications/${id}/read`);

/**
 * Mark all notifications as read for the current user.
 * @returns {Promise<{ message: string, count: number }>}
 */
export const markAllAsRead = () =>
  api.patch('/notifications/mark-all-read');

/**
 * Get notification delivery statistics (for the stats cards).
 * @param {object} [params]
 * @param {string} [params.range] — 'today' | 'week' | 'month'
 * @returns {Promise<{ total: number, delivered: number, pending: number, failed: number, rate: number }>}
 */
export const getNotificationStats = (params = {}) =>
  api.get('/notifications/stats', { params });
