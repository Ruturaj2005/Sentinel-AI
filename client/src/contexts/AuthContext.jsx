import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);
let hasInitializedAuth = false;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (hasInitializedAuth) {
      return;
    }
    hasInitializedAuth = true;

    const initializeAuth = async () => {
      // Check for stored auth on mount
      const storedUser = authService.getStoredUser();
      const token = authService.getStoredToken();

      if (storedUser && token) {
        setUser(storedUser);
        setIsAuthenticated(true);
        setLoading(false);
      } else {
        // Start unauthenticated on landing page; demo button triggers role session.
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const switchRole = async (role, employeeId = null) => {
    try {
      setLoading(true);
      const data = await authService.switchRole(role, employeeId);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      console.error('Role switch failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    role: user?.role,
    isAuthenticated,
    loading,
    switchRole,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
