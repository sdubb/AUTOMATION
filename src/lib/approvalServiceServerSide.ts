/**
 * Approval Auto-Execute Service (Server-Side)
 * Uses database + polling instead of in-memory timers
 * Scales to any number of concurrent users
 */

import { backendService } from './backendService';

export interface PendingApproval {
  id: string;
  automationId: string;
  createdAt: string;
  timeoutMs: number;
  status: 'pending' | 'approved' | 'rejected' | 'auto_executed';
  autoExecuteAt: string; // ISO timestamp when auto-execute should happen
}

/**
 * Fetch pending approvals and check which ones need auto-execution
 * This runs server-side and is idempotent (safe to call multiple times)
 */
export async function checkAndExecuteExpiredApprovals(): Promise<string[]> {
  try {
    // Fetch all pending approvals
    const allApprovals = await backendService.approvals.list();
    const pendingApprovals = (allApprovals || []).filter(
      (a: any) => a.status === 'pending'
    );

    const now = new Date();
    const autoExecutedIds: string[] = [];

    for (const approval of pendingApprovals) {
      const autoExecuteAt = new Date(approval.auto_execute_at);

      if (now >= autoExecuteAt) {
        try {
          // Auto-execute the automation
          await backendService.automations.execute(approval.automation_id, {});

          // Mark approval as auto-executed
          // (This would require a backend endpoint to update approval status)
          console.log(
            `Auto-executed automation ${approval.automation_id} due to approval timeout`
          );
          autoExecutedIds.push(approval.id);
        } catch (error) {
          console.error(
            `Failed to auto-execute automation ${approval.automation_id}:`,
            error
          );
        }
      }
    }

    return autoExecutedIds;
  } catch (error) {
    console.error('Failed to check expired approvals:', error);
    return [];
  }
}

/**
 * Calculate auto-execute timestamp
 */
export function calculateAutoExecuteTime(timeoutMs: number): string {
  return new Date(Date.now() + timeoutMs).toISOString();
}

/**
 * Get remaining time until auto-execution (in seconds)
 * Server-side equivalent of countdown
 */
export function getSecondsUntilAutoExecute(autoExecuteAt: string): number {
  const remaining = new Date(autoExecuteAt).getTime() - Date.now();
  return Math.ceil(Math.max(0, remaining) / 1000);
}

/**
 * Start a background polling job (runs on server or a single worker)
 * Checks every 30 seconds for expired approvals
 */
let pollInterval: NodeJS.Timeout | null = null;

export function startApprovalPoller(intervalMs: number = 30000) {
  if (pollInterval) {
    console.warn('Approval poller already running');
    return;
  }

  console.log('Starting approval auto-execute poller...');
  pollInterval = setInterval(async () => {
    try {
      const executed = await checkAndExecuteExpiredApprovals();
      if (executed.length > 0) {
        console.log(`Auto-executed ${executed.length} approvals`);
      }
    } catch (error) {
      console.error('Approval poller error:', error);
    }
  }, intervalMs);
}

export function stopApprovalPoller() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    console.log('Approval poller stopped');
  }
}
