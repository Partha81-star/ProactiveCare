import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Base Axios instance — all API calls go through here.
 *
 * Set your backend URL in .env:
 *   VITE_API_BASE_URL=http://localhost:8000/api
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Automatically attaches Bearer token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handles global errors (401 → logout, network errors, etc.)
api.interceptors.response.use(
  (response) => response.data,          // unwrap response.data automatically
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or invalid — clear session and redirect to login
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
    }

    // Build a clean error object for the calling code
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      'An unexpected error occurred.';

    return Promise.reject({ status, message, raw: error });
  }
);

export default api;
