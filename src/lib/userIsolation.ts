/**
 * User Isolation & Authorization
 * Ensures every API call is scoped to the current user
 * Prevents data leakage between users
 */

import { useApi } from '../contexts/ApiContext';

/**
 * Filter automations to only show user's own (unless admin)
 */
export function filterAutomationsByUser(
  automations: any[],
  currentUserId: string,
  isAdmin: boolean
): any[] {
  if (isAdmin) {
    // Admins see all automations
    return automations;
  }

  // Regular users see only their own
  return automations.filter((auto) => auto.created_by === currentUserId);
}

/**
 * Filter connections to only show user's own (unless admin)
 */
export function filterConnectionsByUser(
  connections: any[],
  currentUserId: string,
  isAdmin: boolean
): any[] {
  if (isAdmin) {
    return connections;
  }

  return connections.filter((conn) => conn.created_by === currentUserId);
}

/**
 * Filter approvals to show only relevant to current user
 * - User sees approvals for their own automations
 * - User sees approvals where they're listed as approver
 * - Admins see all approvals
 */
export function filterApprovalsByUser(
  approvals: any[],
  currentUserId: string,
  isAdmin: boolean
): any[] {
  if (isAdmin) {
    return approvals;
  }

  return approvals.filter(
    (approval) =>
      approval.automation_created_by === currentUserId || // User created the automation
      (approval.approval_recipients || []).includes(currentUserId) // User is an approver
  );
}

/**
 * Verify user can perform action on resource
 * Throws if unauthorized
 */
export function verifyOwnership(
  resource: any,
  currentUserId: string,
  isAdmin: boolean
): void {
  if (isAdmin) {
    // Admins can do anything
    return;
  }

  // Check if user is the owner
  if (resource.created_by !== currentUserId && resource.owner_id !== currentUserId) {
    throw new Error('Unauthorized: You do not own this resource');
  }
}

/**
 * Build API filters for multi-user queries
 * Every API call should include these filters
 */
export function buildUserFilter(currentUserId: string, isAdmin: boolean): Record<string, any> {
  if (isAdmin) {
    // Admins can query all users' data
    return {};
  }

  // Regular users only query their own data
  return {
    created_by: currentUserId,
  };
}

/**
 * Middleware to enforce user context on all API calls
 * Attach current user ID to every request header
 */
export function getUserAuthorizationHeader(currentUserId: string): Record<string, string> {
  return {
    'X-User-ID': currentUserId,
  };
}

/**
 * Hook to get current user ID for use in components
 * Ensures every component knows who the user is
 */
export function useCurrentUserId(): string | null {
  const { user } = useApi();
  return user?.id || null;
}
