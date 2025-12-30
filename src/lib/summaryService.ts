/**
 * Execution Summary Service
 * Generates human-friendly summaries from execution logs using Groq
 */

import { backendService } from './backendService';

export interface ExecutionSummary {
  automationId: string;
  executionId: string;
  status: 'success' | 'failure' | 'partial';
  summary: string;
  keyMetrics: {
    triggersMatched: number;
    actionsExecuted: number;
    errorCount: number;
    duration: string;
  };
  highlightedFailures: string[];
  nextSteps: string[];
}

/**
 * Generate a summary from raw execution logs using Groq
 */
export async function generateExecutionSummary(
  automationName: string,
  executionId: string,
  logs: any[]
): Promise<ExecutionSummary> {
  try {
    // Parse logs to extract key info
    const errors = logs.filter((log) => log.level === 'error');
    const succeededActions = logs.filter(
      (log) => log.level === 'info' && log.message?.includes('executed')
    );
    const duration = logs.length > 0 ? calculateDuration(logs) : '0s';

    // Build prompt for Groq to summarize
    const prompt = `
You are an automation execution summarizer. Given the following execution logs, provide a brief (2-3 sentence) human-friendly summary.

**Automation:** ${automationName}
**Status:** ${errors.length === 0 ? 'Success' : errors.length > 0 ? 'Failure' : 'Partial'}
**Duration:** ${duration}
**Succeeded Actions:** ${succeededActions.length}
**Errors:** ${errors.length}

**Error Details:**
${errors.map((e) => `- ${e.message}`).join('\n')}

**Action Details:**
${succeededActions.map((a) => `- ${a.message}`).join('\n')}

Provide a summary that:
1. Explains the overall outcome in plain language
2. Highlights any critical errors
3. Suggests next steps if needed (e.g., "Check the API connection" or "No action needed")

Format as JSON:
{
  "summary": "...",
  "highlightedFailures": ["...", "..."],
  "nextSteps": ["...", "..."]
}
`;

    const result = await backendService.groq.planAutomation(prompt);

    // Parse Groq response
    let parsedResult;
    try {
      parsedResult = JSON.parse(result.plan || result);
    } catch {
      parsedResult = {
        summary: result.plan || result,
        highlightedFailures: errors.map((e) => e.message),
        nextSteps: [
          'Review the raw logs for detailed information',
          'Contact support if issues persist',
        ],
      };
    }

    return {
      automationId: automationName,
      executionId,
      status: errors.length === 0 ? 'success' : 'failure',
      summary: parsedResult.summary || 'Execution completed',
      keyMetrics: {
        triggersMatched: 1,
        actionsExecuted: succeededActions.length,
        errorCount: errors.length,
        duration,
      },
      highlightedFailures: parsedResult.highlightedFailures || [],
      nextSteps: parsedResult.nextSteps || [],
    };
  } catch (error) {
    console.error('Failed to generate summary:', error);
    return {
      automationId: automationName,
      executionId,
      status: 'failure',
      summary:
        'Summary generation failed. Please check the raw execution logs below.',
      keyMetrics: {
        triggersMatched: 0,
        actionsExecuted: 0,
        errorCount: 1,
        duration: '0s',
      },
      highlightedFailures: [
        `Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      nextSteps: ['Review raw logs manually', 'Contact support if needed'],
    };
  }
}

/**
 * Calculate duration from logs
 */
function calculateDuration(logs: any[]): string {
  if (logs.length === 0) return '0s';

  const firstLog = logs[0];
  const lastLog = logs[logs.length - 1];

  if (!firstLog.timestamp || !lastLog.timestamp) return '0s';

  const durationMs =
    new Date(lastLog.timestamp).getTime() -
    new Date(firstLog.timestamp).getTime();
  const seconds = Math.round(durationMs / 1000);

  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}
