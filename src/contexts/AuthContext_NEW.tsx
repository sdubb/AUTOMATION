/**
 * Auth Context - Now using ActivePieces backend
 * Removed dependency on Supabase
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  loginToActivePieces,
  signupToActivePieces,
  verifyToken,
  logoutFromActivePieces,
  getStoredToken,
  storeToken,
  clearToken,
  ActivePiecesUser,
} from '../lib/activepiecesAuth';

interface AuthContextType {
  user: ActivePiecesUser | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ActivePiecesUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On app load, verify stored token if it exists
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = getStoredToken();
        if (storedToken) {
          // Verify token is still valid
          const verifiedUser = await verifyToken(storedToken);
          setUser(verifiedUser);
          setToken(storedToken);
        }
      } catch (err) {
        // Token invalid or expired, clear it
        console.error('Auth verification failed:', err);
        clearToken();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { token: newToken, user: newUser } = await loginToActivePieces(
        email,
        password
      );

      // Store token for future requests
      storeToken(newToken);

      // Update context
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      clearToken();
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { token: newToken, user: newUser } = await signupToActivePieces(
        email,
        password
      );

      // Store token for future requests
      storeToken(newToken);

      // Update context
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      clearToken();
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (token) {
        await logoutFromActivePieces(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      clearToken();
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
