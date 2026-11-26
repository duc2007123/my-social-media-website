import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { registerSocketUser, unregisterSocketUser } from '../socket/socketClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    unregisterSocketUser();
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // Check token and fetch current user profile
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(res.data.data);
          localStorage.setItem('user', JSON.stringify(res.data.data));
          registerSocketUser(res.data.data._id, storedToken);
        } catch {
          console.warn('[Auth] Token expired or invalid, logging out');
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, [token, logout]);

  const login = async (emailOrUsername, password) => {
    const res = await axios.post('/api/auth/login', { emailOrUsername, password });
    const { token: newToken, ...userData } = res.data.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    registerSocketUser(userData._id, newToken);
    return res.data;
  };

  const register = async (name, username, email, password) => {
    const res = await axios.post('/api/auth/register', { name, username, email, password });
    const { token: newToken, ...userData } = res.data.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    registerSocketUser(userData._id, newToken);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
