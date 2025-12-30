/**
 * API Service Layer
 * Unified interface for all API calls (abstracts away backend details)
 */

import activepieces from './activepieces';

// Re-export ActivePieces client as default API
export const api = activepieces;

// Convenience exports
export const { auth, automations, connections, triggers, actions, webhooks, executionLogs, approvals } = activepieces;

/**
 * Helper to check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('activepieces_token');
  return !!token;
}

/**
 * Get stored authentication token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('activepieces_token');
}

/**
 * Store authentication token
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('activepieces_token', token);
}

/**
 * Clear authentication token
 */
export function clearAuthToken(): void {
  localStorage.removeItem('activepieces_token');
}

/**
 * Handle login and store token
 */
export async function login(email: string, password: string) {
  const response = await auth.login(email, password);
  if (response.token) {
    setAuthToken(response.token);
  }
  return response;
}

/**
 * Handle logout and clear token
 */
export async function logout() {
  await auth.logout();
  clearAuthToken();
}

export default api;
