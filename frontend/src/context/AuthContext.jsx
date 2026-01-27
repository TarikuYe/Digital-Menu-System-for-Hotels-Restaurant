import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, guestAPI } from '../services/api.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Support Guest Tokens */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const guestToken = localStorage.getItem('guestToken');
    const savedUser = localStorage.getItem('user');

    if (token) {
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      // Verify token is still valid
      authAPI.getMe()
        .then((response) => {
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else if (guestToken) {
      // Validate Guest Session
      console.log('Restoring guest session...');
      guestAPI.getSessionStatus()
        .then(res => {
          setUser(res.data.session);
        })
        .catch(err => {
          console.error("Guest session expired", err);
          localStorage.removeItem('guestToken');
          localStorage.removeItem('guestInfo');
          setUser(null);
        })
        .finally(() => setLoading(false));

    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.removeItem('guestToken'); // Clear guest if logging in
    localStorage.removeItem('guestInfo');
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const loginGuest = (guestToken, userData) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.setItem('guestToken', guestToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('guestToken');
    localStorage.removeItem('guestInfo');
    setUser(null);
  };

  const value = {
    user,
    login,
    loginGuest,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff' || user?.role === 'admin',
    isCustomer: user?.role === 'customer',
    updateUser: (data) => setUser(prev => ({ ...prev, ...data })),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

