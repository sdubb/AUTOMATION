/**
 * Notification Service
 * Sends approval requests via Slack, Email, and SMS
 */

export interface NotificationPayload {
  approvalId: string;
  automationName: string;
  automationDescription: string;
  triggerData: any;
  actionPreview: string;
  approveUrl: string;
  rejectUrl: string;
  timeoutMinutes: number;
  recipients: string[];
  channels: ('email' | 'slack' | 'sms')[];
}

/**
 * Send approval notification via selected channels
 * This is a client-side wrapper; actual sending happens on backend
 */
export async function sendApprovalNotification(
  payload: NotificationPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/notifications/approval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('activepieces_token') || ''}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Notification send failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      message: `Notification sent via ${payload.channels.join(', ')}`,
    };
  } catch (error) {
    console.error('Failed to send approval notification:', error);
    return {
      success: false,
      message: `Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Format approval request for email body
 */
export function formatApprovalEmailBody(payload: NotificationPayload): string {
  return `
Hello,

A new automation approval request requires your attention.

**Automation:** ${payload.automationName}
**Description:** ${payload.automationDescription}
**Time to decide:** ${payload.timeoutMinutes} minutes before auto-execution

**Trigger Data:**
${JSON.stringify(payload.triggerData, null, 2)}

**Proposed Action:**
${payload.actionPreview}

**Decision Required:**
Approve: ${payload.approveUrl}
Reject: ${payload.rejectUrl}

If you do not respond within ${payload.timeoutMinutes} minutes, the automation will execute automatically.

---
This is an automated message. Do not reply to this email.
`;
}

/**
 * Format approval request for Slack message
 */
export function formatApprovalSlackMessage(payload: NotificationPayload): any {
  return {
    text: `🔔 Approval Request: ${payload.automationName}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🔔 Approval Required: ${payload.automationName}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:* ${payload.automationDescription}\n*Timeout:* ${payload.timeoutMinutes} minutes before auto-execute`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Trigger Data:*\n\`\`\`${JSON.stringify(payload.triggerData, null, 2)}\`\`\``,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Approve',
              emoji: true,
            },
            value: payload.approvalId,
            action_id: 'approve_action',
            style: 'primary',
            url: payload.approveUrl,
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Reject',
              emoji: true,
            },
            value: payload.approvalId,
            action_id: 'reject_action',
            style: 'danger',
            url: payload.rejectUrl,
          },
        ],
      },
    ],
  };
}
