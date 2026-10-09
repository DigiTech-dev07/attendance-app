import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('dg_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('dg_token') || null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refresh user data from backend
  const refreshUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.auth.getMe();
      if (res.success) {
        setUser(res.user);
        setUserProfile(res);
        localStorage.setItem('dg_user', JSON.stringify(res.user));
      }
    } catch (err) {
      console.warn('Failed to refresh user session:', err.message);
      if (err.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    if (res.success && res.token) {
      localStorage.setItem('dg_token', res.token);
      localStorage.setItem('dg_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      await refreshUser();
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password) => {
    const res = await api.auth.register(name, email, password);
    if (res.success && res.token) {
      localStorage.setItem('dg_token', res.token);
      localStorage.setItem('dg_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      await refreshUser();
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const loginWithGoogle = async (googleProfile) => {
    const res = await api.auth.google(googleProfile);
    if (res.success && res.token) {
      localStorage.setItem('dg_token', res.token);
      localStorage.setItem('dg_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      await refreshUser();
      return res;
    }
    throw new Error(res.message || 'Google sign-in failed');
  };

  const loginAdmin = async (email, password) => {
    const res = await api.auth.adminLogin(email, password);
    if (res.success && res.token) {
      localStorage.setItem('dg_token', res.token);
      localStorage.setItem('dg_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Admin authentication failed');
  };

  const logout = () => {
    localStorage.removeItem('dg_token');
    localStorage.removeItem('dg_user');
    setToken(null);
    setUser(null);
    setUserProfile(null);
  };

  const value = {
    user,
    token,
    userProfile,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    loading,
    login,
    register,
    loginWithGoogle,
    loginAdmin,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
