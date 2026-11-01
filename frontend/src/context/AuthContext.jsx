import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('reshare_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('reshare_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('reshare_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.data.user);
          localStorage.setItem('reshare_user', JSON.stringify(res.data.data.user));
        }
      } catch (err) {
        console.warn('Session expired or invalid token:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { user: loggedInUser, token: authToken } = res.data.data;
      setUser(loggedInUser);
      setToken(authToken);
      localStorage.setItem('reshare_token', authToken);
      localStorage.setItem('reshare_user', JSON.stringify(loggedInUser));
      return loggedInUser;
    }
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      const { user: newUser, token: authToken } = res.data.data;
      setUser(newUser);
      setToken(authToken);
      localStorage.setItem('reshare_token', authToken);
      localStorage.setItem('reshare_user', JSON.stringify(newUser));
      return newUser;
    }
  };

  const logout = () => {
    try {
      api.post('/auth/logout').catch(() => {});
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('reshare_token');
      localStorage.removeItem('reshare_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout
      }}
    >
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
