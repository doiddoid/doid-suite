import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const response = await api.getCurrentUser();
          if (response.success) {
            setUser(response.data);
            setOrganizations(response.data.organizations || []);

            // Set current organization from localStorage or first one
            const savedOrgId = localStorage.getItem('currentOrganizationId');
            const savedOrg = response.data.organizations?.find(o => o.id === savedOrgId);
            setCurrentOrganization(savedOrg || response.data.organizations?.[0] || null);
          }
        } catch (err) {
          console.error('Auth init error:', err);
          api.removeToken();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const response = await api.login({ email, password });
      if (response.success) {
        setUser(response.data.user);
        setOrganizations(response.data.organizations || []);
        setCurrentOrganization(response.data.organizations?.[0] || null);
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      const errorMessage = err.message || 'Errore durante il login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Register
  const register = useCallback(async (data) => {
    setError(null);
    try {
      const response = await api.register(data);
      if (response.success) {
        return { success: true, message: response.message };
      }
      return { success: false, error: response.error };
    } catch (err) {
      const errorMessage = err.message || 'Errore durante la registrazione';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setOrganizations([]);
      setCurrentOrganization(null);
      localStorage.removeItem('currentOrganizationId');
    }
  }, []);

  // Switch organization
  const switchOrganization = useCallback((organization) => {
    setCurrentOrganization(organization);
    localStorage.setItem('currentOrganizationId', organization.id);
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.getCurrentUser();
      if (response.success) {
        setUser(response.data);
        setOrganizations(response.data.organizations || []);
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  }, []);

  // Create organization
  const createOrganization = useCallback(async (data) => {
    try {
      const response = await api.createOrganization(data);
      if (response.success) {
        await refreshUser();
        setCurrentOrganization(response.data);
        localStorage.setItem('currentOrganizationId', response.data.id);
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [refreshUser]);

  const value = {
    user,
    organizations,
    currentOrganization,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    switchOrganization,
    refreshUser,
    createOrganization,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
