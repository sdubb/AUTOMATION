/**
 * API Context
 * Provides API client and authentication state to entire app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, login as apiLogin, logout as apiLogout, isAuthenticated } from '../lib/api';

interface User {
  id: string;
  email: string;
  firstName?: string;
  role?: string;
  isAdmin?: boolean;
}

interface ApiContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  api: typeof api;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, firstName?: string) => Promise<void>;
  hasRole: (role: string) => boolean;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      if (isAuthenticated()) {
        const currentUser = await api.auth.getCurrentUser();
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          firstName: currentUser.firstName,
          role: (currentUser as any).role || (currentUser as any).roles || undefined,
          isAdmin: ((currentUser as any).role || (currentUser as any).roles) === 'admin',
        });
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      await apiLogin(email, password);
      const currentUser = await api.auth.getCurrentUser();
      setUser({
        id: currentUser.id,
        email: currentUser.email,
        firstName: currentUser.firstName,
        role: (currentUser as any).role || (currentUser as any).roles || undefined,
        isAdmin: ((currentUser as any).role || (currentUser as any).roles) === 'admin',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    try {
      await apiLogout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  function hasRole(role: string) {
    return !!(user && (user.role === role || (user as any).roles === role || user.isAdmin));
  }

  async function signup(email: string, password: string, firstName?: string) {
    setIsLoading(true);
    try {
      await api.auth.signup(email, password, firstName);
      await login(email, password);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ApiContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        api,
        login,
        logout,
        signup,
        hasRole,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
}

export default ApiContext;
