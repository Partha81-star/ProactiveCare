import api from './api';

/**
 * AUTH SERVICE
 * Handles all authentication-related API calls.
 *
 * Backend endpoints expected:
 *   POST   /auth/login
 *   POST   /auth/logout
 *   GET    /auth/profile
 *   POST   /auth/refresh-token
 *   POST   /auth/forgot-password
 *   POST   /auth/reset-password
 */

/**
 * Log in a user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: object, token: string }>}
 *
 * Expected response:
 * {
 *   user: { id, name, email, role },
 *   token: "jwt-token-string"
 * }
 */
export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password });

/**
 * Log out the current user (invalidates token on server).
 * @returns {Promise<void>}
 */
export const logoutUser = () =>
  api.post('/auth/logout');

/**
 * Fetch the currently authenticated user's profile.
 * @returns {Promise<{ id, name, email, role, avatar }>}
 */
export const getProfile = () =>
  api.get('/auth/profile');

/**
 * Refresh the JWT access token using a refresh token.
 * @param {string} refreshToken
 * @returns {Promise<{ token: string }>}
 */
export const refreshToken = (refreshToken) =>
  api.post('/auth/refresh-token', { refreshToken });

/**
 * Send a password reset link to the user's email.
 * @param {string} email
 * @returns {Promise<{ message: string }>}
 */
export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email });

/**
 * Reset password using a reset token from email.
 * @param {string} token   — reset token from email link
 * @param {string} password — new password
 * @returns {Promise<{ message: string }>}
 */
export const resetPassword = (token, password) =>
  api.post('/auth/reset-password', { token, password });
