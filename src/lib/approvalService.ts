/**
 * Approval Service
 * Handles approval lifecycle: request, approve, reject, auto-execute on timeout
 */

import { backendService } from './backendService';

export interface ApprovalWithCountdown {
  id: string;
  automationId: string;
  createdAt: string;
  timeoutMs: number;
  status: 'pending' | 'approved' | 'rejected' | 'auto_executed';
  secondsRemaining: number;
}

// In-memory timers (for demo/local; production would use server-side Redis/DB)
const approvalTimers = new Map<string, NodeJS.Timeout>();
const approvalCountdowns = new Map<string, { timeoutAt: number; timeoutMs: number }>();

/**
 * Start a countdown timer for an approval request.
 * When time expires, auto-execute the automation.
 */
export function startApprovalCountdown(
  approvalId: string,
  automationId: string,
  timeoutMs: number,
  onTimeout: () => void
) {
  // Store timeout details
  approvalCountdowns.set(approvalId, {
    timeoutAt: Date.now() + timeoutMs,
    timeoutMs,
  });

  // Clear any existing timer
  if (approvalTimers.has(approvalId)) {
    clearTimeout(approvalTimers.get(approvalId)!);
  }

  // Set new timer
  const timer = setTimeout(async () => {
    console.log(
      `Approval timeout reached for ${approvalId}. Auto-executing automation ${automationId}`
    );
    onTimeout();
    // Clean up
    approvalTimers.delete(approvalId);
    approvalCountdowns.delete(approvalId);
  }, timeoutMs);

  approvalTimers.set(approvalId, timer);
}

/**
 * Get remaining seconds for an approval countdown
 */
export function getApprovalCountdown(approvalId: string): number {
  const countdown = approvalCountdowns.get(approvalId);
  if (!countdown) return 0;

  const remaining = Math.max(0, countdown.timeoutAt - Date.now());
  return Math.ceil(remaining / 1000);
}

/**
 * Cancel an approval countdown (e.g., if manually approved/rejected)
 */
export function cancelApprovalCountdown(approvalId: string) {
  if (approvalTimers.has(approvalId)) {
    clearTimeout(approvalTimers.get(approvalId)!);
    approvalTimers.delete(approvalId);
  }
  approvalCountdowns.delete(approvalId);
}

/**
 * Get all active approval countdowns with remaining time
 */
export function getActiveCountdowns(): ApprovalWithCountdown[] {
  return Array.from(approvalCountdowns.entries()).map(([id, data]) => ({
    id,
    automationId: '',
    createdAt: new Date(data.timeoutAt - data.timeoutMs).toISOString(),
    timeoutMs: data.timeoutMs,
    status: 'pending',
    secondsRemaining: getApprovalCountdown(id),
  }));
}
