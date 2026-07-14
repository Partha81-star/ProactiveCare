// ─── App Info ────────────────────────────────────────────────────────────────
export const APP_NAME = 'MediConnect AI';
export const APP_VERSION = '1.0.0';

// ─── User Roles ──────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  PATIENT: 'patient',
  RECEPTIONIST: 'receptionist',
};

// ─── Appointment Status ───────────────────────────────────────────────────────
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// ─── Patient Priority ─────────────────────────────────────────────────────────
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// ─── Local Storage Keys ───────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  TOKEN: 'mediconnect_token',
  USER: 'mediconnect_user',
  THEME: 'mediconnect_theme',
};

// ─── Routes ──────────────────────────────────────────────────────────────────
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  DOCTORS: '/doctors',
  APPOINTMENTS: '/appointments',
  AI_NOTIFICATIONS: '/ai-notifications',
  NOTIFICATIONS: '/notifications',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
};

