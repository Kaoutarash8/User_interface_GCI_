/**
 * Contexte d'authentification
 * Gère l'état de connexion de l'utilisateur
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté (depuis localStorage)
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (password) => {
    setLoading(true);
    const result = await apiLogin(password);
    if (result.success) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
    }
    setLoading(false);
    return result;
  };

  const logout = async () => {
    setLoading(true);
    await apiLogout();
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
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

