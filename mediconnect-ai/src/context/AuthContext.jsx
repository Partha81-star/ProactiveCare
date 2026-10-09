import { useState } from 'react';
import { AuthContext } from './useAuth';
import { STORAGE_KEYS } from '../utils/constants';
import { logoutUser } from '../services/authService';

function restoreSession() {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
    return token && user ? { token, user } : { token: null, user: null };
  } catch {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    return { token: null, user: null };
  }
}

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(restoreSession);
  const { user, token } = session;
  const loading = false;
  const login = (userData, authToken) => {
    setSession({ user: userData, token: authToken });
    localStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  };

  const logout = () => {
    logoutUser().catch(() => {});
    setSession({ user: null, token: null });
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
