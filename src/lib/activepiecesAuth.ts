/**
 * ActivePieces Authentication Service
 * 
 * Handles user authentication directly with ActivePieces backend
 * Replaces Supabase authentication
 */

const ACTIVEPIECES_URL = import.meta.env.VITE_ACTIVEPIECES_URL || 'http://172.17.0.4:3000/api';

export interface ActivePiecesUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  token: string;
  user: ActivePiecesUser;
}

/**
 * Login with email and password
 * Returns auth token and user info
 */
export async function loginToActivePieces(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${ACTIVEPIECES_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${error || response.statusText}`);
  }

  return response.json();
}

/**
 * Sign up with email and password
 * Creates new user and returns auth token
 */
export async function signupToActivePieces(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<AuthResponse> {
  const response = await fetch(`${ACTIVEPIECES_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      firstName: firstName || email.split('@')[0],
      lastName: lastName || '',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Signup failed: ${error || response.statusText}`);
  }

  return response.json();
}

/**
 * Verify token with ActivePieces backend
 * Used to restore session on app load
 */
export async function verifyToken(token: string): Promise<ActivePiecesUser> {
  const response = await fetch(`${ACTIVEPIECES_URL}/auth/verify`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Token verification failed');
  }

  return response.json();
}

/**
 * Logout from ActivePieces
 * Invalidates token on server
 */
export async function logoutFromActivePieces(token: string): Promise<void> {
  try {
    await fetch(`${ACTIVEPIECES_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    // Logout failure shouldn't block client-side logout
    console.error('Logout error:', err);
  }
}

/**
 * Get stored auth token from localStorage
 */
export function getStoredToken(): string | null {
  return localStorage.getItem('activepieces_token');
}

/**
 * Store auth token in localStorage
 */
export function storeToken(token: string): void {
  localStorage.setItem('activepieces_token', token);
}

/**
 * Remove auth token from localStorage
 */
export function clearToken(): void {
  localStorage.removeItem('activepieces_token');
}

/**
 * Get authorization headers for API calls
 * Include token in all requests to ActivePieces
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token
    ? { 'Authorization': `Bearer ${token}` }
    : {};
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getStoredToken();
}
