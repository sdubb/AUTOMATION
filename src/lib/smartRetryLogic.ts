/**
 * Smart Retry Logic Service
 * AI-powered retry decisions based on error type and context
 * Reduces flakiness in automation execution
 */

export interface RetryPolicy {
  automationId: string;
  maxRetries: number;
  baseDelay: number; // milliseconds
  backoffMultiplier: number; // exponential backoff: delay * multiplier^attempt
  retryableErrors: string[]; // error patterns to retry on
  nonRetryableErrors: string[]; // errors that should never retry
}

export interface ExecutionAttempt {
  attempt: number;
  status: 'pending' | 'running' | 'success' | 'failed';
  error?: string;
  errorCode?: string;
  duration: number; // milliseconds
  timestamp: string;
}

export interface ExecutionWithRetries {
  executionId: string;
  automationId: string;
  attempts: ExecutionAttempt[];
  finalStatus: 'success' | 'failed' | 'cancelled';
  totalDuration: number;
  shouldRetry: boolean;
  nextRetryDelay?: number;
}

/**
 * Default retry policies for common error types
 */
export const SMART_RETRY_POLICIES: Record<string, RetryPolicy> = {
  api_timeout: {
    automationId: 'api_timeout',
    maxRetries: 3,
    baseDelay: 1000,
    backoffMultiplier: 2,
    retryableErrors: ['timeout', 'timed out', 'ETIMEDOUT', 'ECONNABORTED'],
    nonRetryableErrors: ['401', '403', '404'],
  },
  rate_limit: {
    automationId: 'rate_limit',
    maxRetries: 5,
    baseDelay: 2000,
    backoffMultiplier: 2,
    retryableErrors: ['rate limit', '429', 'too many requests'],
    nonRetryableErrors: ['401', '403'],
  },
  database_error: {
    automationId: 'database_error',
    maxRetries: 2,
    baseDelay: 500,
    backoffMultiplier: 2,
    retryableErrors: ['connection refused', 'deadlock', 'connection pool'],
    nonRetryableErrors: ['syntax error', 'constraint violation'],
  },
  network_error: {
    automationId: 'network_error',
    maxRetries: 4,
    baseDelay: 1000,
    backoffMultiplier: 1.5,
    retryableErrors: ['ECONNREFUSED', 'ENETUNREACH', 'connection reset'],
    nonRetryableErrors: ['400', 'invalid request'],
  },
  generic: {
    automationId: 'generic',
    maxRetries: 2,
    baseDelay: 500,
    backoffMultiplier: 2,
    retryableErrors: ['error'],
    nonRetryableErrors: [],
  },
};

/**
 * Determine if error is retryable
 */
export function isRetryable(error: string, errorCode?: string): boolean {
  const errorLower = error.toLowerCase();

  // Check for non-retryable patterns first
  for (const policy of Object.values(SMART_RETRY_POLICIES)) {
    for (const pattern of policy.nonRetryableErrors) {
      if (errorLower.includes(pattern.toLowerCase()) || errorCode === pattern) {
        return false;
      }
    }
  }

  // Check for retryable patterns
  for (const policy of Object.values(SMART_RETRY_POLICIES)) {
    for (const pattern of policy.retryableErrors) {
      if (errorLower.includes(pattern.toLowerCase()) || errorCode === pattern) {
        return true;
      }
    }
  }

  // Default: retryable
  return true;
}

/**
 * Get appropriate retry policy for error
 */
export function getRetryPolicy(error: string, errorCode?: string): RetryPolicy {
  const errorLower = error.toLowerCase();

  if (
    errorLower.includes('timeout') ||
    errorLower.includes('timed out') ||
    errorCode === 'ETIMEDOUT'
  ) {
    return SMART_RETRY_POLICIES.api_timeout;
  }

  if (
    errorLower.includes('rate limit') ||
    errorLower.includes('too many requests') ||
    errorCode === '429'
  ) {
    return SMART_RETRY_POLICIES.rate_limit;
  }

  if (
    errorLower.includes('connection') ||
    errorLower.includes('deadlock') ||
    errorCode === 'ECONNREFUSED'
  ) {
    if (errorLower.includes('database') || errorLower.includes('db')) {
      return SMART_RETRY_POLICIES.database_error;
    }
    return SMART_RETRY_POLICIES.network_error;
  }

  return SMART_RETRY_POLICIES.generic;
}

/**
 * Calculate delay for retry attempt
 */
export function calculateRetryDelay(policy: RetryPolicy, attemptNumber: number): number {
  // attemptNumber is 0-indexed
  return policy.baseDelay * Math.pow(policy.backoffMultiplier, attemptNumber);
}

/**
 * Should we retry?
 */
export function shouldRetry(
  executionWithRetries: ExecutionWithRetries,
  policy: RetryPolicy
): boolean {
  // Stop if we've hit max retries
  const failedAttempts = executionWithRetries.attempts.filter((a) => a.status === 'failed').length;
  if (failedAttempts >= policy.maxRetries) {
    return false;
  }

  // Only retry on failed status
  const lastAttempt = executionWithRetries.attempts[executionWithRetries.attempts.length - 1];
  if (lastAttempt.status !== 'failed' || !lastAttempt.error) {
    return false;
  }

  // Check if error is retryable
  return isRetryable(lastAttempt.error, lastAttempt.errorCode);
}

/**
 * Create execution tracking
 */
export function createExecutionTracking(automationId: string): ExecutionWithRetries {
  return {
    executionId: crypto.randomUUID?.() || `exec_${Date.now()}_${Math.random()}`,
    automationId,
    attempts: [],
    finalStatus: 'pending' as const,
    totalDuration: 0,
    shouldRetry: false,
  };
}

/**
 * Add attempt to execution
 */
export function addAttempt(
  execution: ExecutionWithRetries,
  status: 'running' | 'success' | 'failed',
  error?: string,
  errorCode?: string,
  duration?: number
): ExecutionWithRetries {
  const attempt: ExecutionAttempt = {
    attempt: execution.attempts.length + 1,
    status,
    error,
    errorCode,
    duration: duration || 0,
    timestamp: new Date().toISOString(),
  };

  execution.attempts.push(attempt);

  if (status === 'success') {
    execution.finalStatus = 'success';
    execution.shouldRetry = false;
  } else if (status === 'failed') {
    execution.shouldRetry = shouldRetry(execution, getRetryPolicy(error || '', errorCode));
    if (execution.shouldRetry) {
      const policy = getRetryPolicy(error || '', errorCode);
      const failedAttempts = execution.attempts.filter((a) => a.status === 'failed').length;
      execution.nextRetryDelay = calculateRetryDelay(policy, failedAttempts - 1);
    } else {
      execution.finalStatus = 'failed';
    }
  }

  // Update total duration
  execution.totalDuration = execution.attempts.reduce((sum, a) => sum + a.duration, 0);

  return execution;
}

/**
 * Get retry summary
 */
export function getRetrySummary(execution: ExecutionWithRetries): {
  totalAttempts: number;
  successAttempt?: number;
  failures: number;
  totalTime: number;
  avgTimePerAttempt: number;
  recommendation: string;
} {
  const successAttempt = execution.attempts.findIndex((a) => a.status === 'success') + 1;
  const failures = execution.attempts.filter((a) => a.status === 'failed').length;
  const avgTime = execution.totalDuration / execution.attempts.length;

  let recommendation = '';
  if (successAttempt > 0) {
    if (successAttempt > 2) {
      recommendation = `Flaky behavior detected. Consider increasing timeouts or reviewing the integration.`;
    } else {
      recommendation = `Successfully executed on attempt ${successAttempt}.`;
    }
  } else {
    recommendation = `Failed after ${failures} attempt(s). Check error logs and integration settings.`;
  }

  return {
    totalAttempts: execution.attempts.length,
    successAttempt: successAttempt > 0 ? successAttempt : undefined,
    failures,
    totalTime: execution.totalDuration,
    avgTimePerAttempt: Math.round(avgTime),
    recommendation,
  };
}

/**
 * Get AI-powered recommendation for automation
 */
export function getRetryRecommendation(execution: ExecutionWithRetries): string {
  const summary = getRetrySummary(execution);

  if (summary.totalAttempts === 1 && execution.finalStatus === 'success') {
    return '✅ Perfect execution on first try. No changes needed.';
  }

  if (execution.finalStatus === 'failed') {
    const lastAttempt = execution.attempts[execution.attempts.length - 1];
    const policy = getRetryPolicy(lastAttempt.error || '', lastAttempt.errorCode);

    if (policy === SMART_RETRY_POLICIES.rate_limit) {
      return '⚠️ Rate limited. Consider adding delays between requests or upgrading your API plan.';
    }

    if (policy === SMART_RETRY_POLICIES.api_timeout) {
      return '⏱️ Timeouts occurring. Increase timeout duration or optimize the workflow for speed.';
    }

    if (policy === SMART_RETRY_POLICIES.network_error) {
      return '🔌 Network issues detected. Ensure integrations are accessible and have proper firewall rules.';
    }

    return '❌ Persistent failure. Review error logs and integration credentials.';
  }

  return `✨ Success after ${summary.totalAttempts} attempt(s). Good retry strategy working.`;
}
