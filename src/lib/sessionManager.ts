/**
 * Session Management & Token Refresh
 * Handles token expiry, refresh, and 401 errors globally
 */

import { verifyToken, loginToActivePieces } from './activepiecesAuth';

const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry
let refreshPromise: Promise<string> | null = null;

/**
 * Global error handler for API responses
 * Automatically refresh token on 401, then retry
 */
export async function handleApiError(
  response: Response,
  retryFn: () => Promise<Response>
): Promise<Response> {
  if (response.status === 401) {
    console.warn('Token expired. Attempting refresh...');

    const refreshed = await refreshAccessToken();
    if (refreshed) {
      console.log('Token refreshed. Retrying request...');
      return retryFn();
    } else {
      console.error('Token refresh failed. User must re-authenticate.');
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('logout', { detail: 'Session expired' }));
      throw new Error('Session expired. Please log in again.');
    }
  }

  return response;
}

/**
 * Refresh access token (if supported by ActivePieces)
 * Returns true if successful, false otherwise
 */
export async function refreshAccessToken(): Promise<boolean> {
  // Prevent multiple simultaneous refresh attempts
  if (refreshPromise) {
    await refreshPromise;
    return !!localStorage.getItem('activepieces_token');
  }

  refreshPromise = (async () => {
    try {
      // Check if we have a refresh token or can re-verify
      const token = localStorage.getItem('activepieces_token');
      if (!token) {
        throw new Error('No token found');
      }

      // Attempt to verify the current token
      // If this fails, the token is truly expired
      const user = await verifyToken(token);
      console.log('Token still valid:', user.email);

      // Return the existing token
      return token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear invalid token
      localStorage.removeItem('activepieces_token');
      throw error;
    }
  })();

  try {
    const newToken = await refreshPromise;
    refreshPromise = null;
    return !!newToken;
  } catch (error) {
    refreshPromise = null;
    return false;
  }
}

/**
 * Check if token needs refresh (within threshold of expiry)
 * Note: This requires the backend to return token expiry info
 */
export function shouldRefreshToken(): boolean {
  const tokenMeta = localStorage.getItem('activepieces_token_meta');
  if (!tokenMeta) return false;

  try {
    const { expiresAt } = JSON.parse(tokenMeta);
    if (!expiresAt) return false;

    const timeUntilExpiry = new Date(expiresAt).getTime() - Date.now();
    return timeUntilExpiry < TOKEN_REFRESH_THRESHOLD_MS;
  } catch {
    return false;
  }
}

/**
 * Store token metadata (expiry, etc.) for refresh logic
 */
export function storeTokenMetadata(
  token: string,
  expiresIn?: number | string
) {
  let expiresAt: string;

  if (typeof expiresIn === 'number') {
    // expiresIn is in seconds
    expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  } else if (typeof expiresIn === 'string') {
    // expiresIn is an ISO string
    expiresAt = expiresIn;
  } else {
    // Default to 24 hours
    expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }

  localStorage.setItem(
    'activepieces_token_meta',
    JSON.stringify({ token, expiresAt, storedAt: new Date().toISOString() })
  );
}

/**
 * Clear session data (logout)
 */
export function clearSession() {
  localStorage.removeItem('activepieces_token');
  localStorage.removeItem('activepieces_token_meta');
  localStorage.removeItem('activepieces_user');
  refreshPromise = null;
}

/**
 * Get remaining session time in seconds (or -1 if expired)
 */
export function getRemainingSessionTime(): number {
  const tokenMeta = localStorage.getItem('activepieces_token_meta');
  if (!tokenMeta) return -1;

  try {
    const { expiresAt } = JSON.parse(tokenMeta);
    const remaining = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(remaining / 1000);
  } catch {
    return -1;
  }
}

/**
 * Start a background timer to refresh token before expiry
 */
export function startSessionManager() {
  const checkInterval = setInterval(() => {
    if (shouldRefreshToken()) {
      refreshAccessToken().catch((error) => {
        console.error('Background token refresh failed:', error);
        clearSession();
        window.dispatchEvent(new CustomEvent('logout', { detail: 'Session expired' }));
      });
    }
  }, 60000); // Check every minute

  // Store interval ID so it can be cleared later
  (window as any).__sessionManagerInterval = checkInterval;
}

/**
 * Stop the background session manager
 */
export function stopSessionManager() {
  const intervalId = (window as any).__sessionManagerInterval;
  if (intervalId) {
    clearInterval(intervalId);
  }
}
