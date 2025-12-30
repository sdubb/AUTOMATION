/**
 * Stateless Session Manager (Production-Ready)
 * Uses JWT expiry + server-side validation instead of client-side timers
 * Scales to unlimited concurrent users
 */

/**
 * Check if a JWT token is expired or about to expire
 * Tokens are validated on every request by the backend
 */
export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

/**
 * Check if token should be refreshed proactively
 * (e.g., refresh if less than 5 minutes remain)
 */
export function shouldRefreshToken(expiresAt: string, thresholdMs: number = 5 * 60 * 1000): boolean {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  return remaining <= thresholdMs;
}

/**
 * Global error handler for 401 responses
 * Instead of managing client-side timers, rely on server to reject expired tokens
 */
export async function handleUnauthorized(
  onLogout: () => void
): Promise<void> {
  console.warn('Token invalid or expired. Logging out.');
  onLogout();
  
  // Dispatch logout event for all listeners
  window.dispatchEvent(
    new CustomEvent('unauthorized', {
      detail: 'Your session has expired. Please log in again.',
    })
  );
}

/**
 * Intercept all API responses and handle 401
 * This is stateless and can be called from any component
 */
export function setupGlobalErrorHandler(
  onLogout: () => void
): void {
  // Hook into fetch globally (or axios interceptors if using axios)
  const originalFetch = window.fetch;

  (window as any).fetch = async function (
    ...args: any[]
  ): Promise<Response> {
    const response = await originalFetch.apply(window, args);

    if (response.status === 401) {
      await handleUnauthorized(onLogout);
      // Optionally return original response or throw
    }

    return response;
  };

  console.log('Global 401 error handler installed');
}

/**
 * Get token from localStorage
 * No timers, no state — just read-only
 */
export function getTokenInfo(): { token: string | null; expiresAt: string | null } {
  const tokenMeta = localStorage.getItem('activepieces_token_meta');
  const token = localStorage.getItem('activepieces_token');

  if (!tokenMeta || !token) {
    return { token: null, expiresAt: null };
  }

  try {
    const { expiresAt } = JSON.parse(tokenMeta);
    return { token, expiresAt };
  } catch {
    return { token, expiresAt: null };
  }
}

/**
 * Simple check: is user currently logged in?
 * No timers, no background jobs — just state check
 */
export function isLoggedIn(): boolean {
  const token = localStorage.getItem('activepieces_token');
  return !!token;
}

/**
 * Clear session completely
 */
export function clearSession(): void {
  localStorage.removeItem('activepieces_token');
  localStorage.removeItem('activepieces_token_meta');
  localStorage.removeItem('activepieces_user');
}

/**
 * Notify all tabs that session is invalid
 * Useful for multi-tab scenarios
 */
export function broadcastLogout(): void {
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel('auth');
    channel.postMessage({ type: 'logout' });
    channel.close();
  }
}
