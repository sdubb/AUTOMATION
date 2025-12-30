/**
 * Execution Analytics Service
 * Tracks automation performance metrics
 * Helps users understand ROI of automation
 */

export interface ExecutionMetrics {
  automationId: string;
  automationName: string;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  successRate: number; // percentage
  avgExecutionTime: number; // milliseconds
  lastExecutionAt: string; // ISO timestamp
  thisMonthExecutions: number;
  thisMonthFailures: number;
  estimatedTimeSaved: number; // minutes
  estimatedCost: number; // USD (API calls, etc.)
  trend: 'up' | 'down' | 'stable'; // execution frequency trend
}

export interface ExecutionSeries {
  date: string; // YYYY-MM-DD
  executions: number;
  successes: number;
  failures: number;
  duration: number; // avg seconds
}

/**
 * Calculate execution metrics from logs
 */
export function calculateExecutionMetrics(
  automationId: string,
  automationName: string,
  executionLogs: any[]
): ExecutionMetrics {
  const total = executionLogs.length;
  const successes = executionLogs.filter((log) => log.status === 'success').length;
  const failures = executionLogs.filter((log) => log.status === 'failure').length;
  const skipped = executionLogs.filter((log) => log.status === 'skipped').length;

  const durations = executionLogs
    .map((log) => log.duration_ms || 0)
    .filter((d) => d > 0);
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b) / durations.length : 0;

  const thisMonth = executionLogs.filter((log) => {
    const logDate = new Date(log.created_at);
    const now = new Date();
    return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
  });

  const thisMonthFailures = thisMonth.filter((log) => log.status === 'failure').length;

  // Estimate time saved: assume automation saves 5 minutes per execution
  const timeSaved = total * 5;

  // Estimate cost: assume 2 API calls per execution at $0.0001 each
  const cost = total * 2 * 0.0001;

  // Determine trend
  const lastWeek = executionLogs.filter((log) => {
    const logDate = new Date(log.created_at);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return logDate >= weekAgo;
  });
  const previousWeek = executionLogs.filter((log) => {
    const logDate = new Date(log.created_at);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    return logDate >= twoWeeksAgo && logDate < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  });

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (lastWeek.length > previousWeek.length * 1.2) {
    trend = 'up';
  } else if (lastWeek.length < previousWeek.length * 0.8) {
    trend = 'down';
  }

  return {
    automationId,
    automationName,
    totalExecutions: total,
    successCount: successes,
    failureCount: failures,
    skippedCount: skipped,
    successRate: total > 0 ? (successes / total) * 100 : 0,
    avgExecutionTime: avgDuration,
    lastExecutionAt: executionLogs[0]?.created_at || new Date().toISOString(),
    thisMonthExecutions: thisMonth.length,
    thisMonthFailures,
    estimatedTimeSaved: timeSaved,
    estimatedCost: cost,
    trend,
  };
}

/**
 * Generate execution data for charting (last 30 days)
 */
export function generateExecutionSeries(executionLogs: any[]): ExecutionSeries[] {
  const series: Record<string, ExecutionSeries> = {};

  // Initialize last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    series[dateStr] = {
      date: dateStr,
      executions: 0,
      successes: 0,
      failures: 0,
      duration: 0,
    };
  }

  // Populate with actual data
  const durations: Record<string, number[]> = {};

  for (const log of executionLogs) {
    const dateStr = log.created_at.split('T')[0];
    if (series[dateStr]) {
      series[dateStr].executions++;
      if (log.status === 'success') series[dateStr].successes++;
      if (log.status === 'failure') series[dateStr].failures++;

      if (!durations[dateStr]) durations[dateStr] = [];
      durations[dateStr].push(log.duration_ms || 0);
    }
  }

  // Calculate average duration
  for (const dateStr in durations) {
    const values = durations[dateStr].filter((d) => d > 0);
    series[dateStr].duration = values.length > 0 ? values.reduce((a, b) => a + b) / values.length / 1000 : 0;
  }

  return Object.values(series).reverse();
}

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: ExecutionMetrics) {
  return {
    successRate: `${metrics.successRate.toFixed(1)}%`,
    avgTime: `${(metrics.avgExecutionTime / 1000).toFixed(2)}s`,
    timeSaved: `${Math.round(metrics.estimatedTimeSaved)} min`,
    cost: `$${metrics.estimatedCost.toFixed(4)}`,
    trend: metrics.trend === 'up' ? '📈' : metrics.trend === 'down' ? '📉' : '→',
  };
}

/**
 * Get insights from metrics
 */
export function getInsights(metrics: ExecutionMetrics): string[] {
  const insights: string[] = [];

  if (metrics.successRate >= 99) {
    insights.push('🎯 Highly reliable automation (99%+ success rate)');
  } else if (metrics.successRate >= 90) {
    insights.push('✅ Good reliability (90%+ success rate)');
  } else if (metrics.failureCount > 5) {
    insights.push('⚠️ Consider reviewing failures to improve reliability');
  }

  if (metrics.trend === 'up') {
    insights.push('📈 Usage is increasing - great adoption!');
  }

  if (metrics.thisMonthExecutions > 100) {
    insights.push('🚀 Heavy usage this month - significant time savings');
  }

  if (metrics.avgExecutionTime > 5000) {
    insights.push('⏱️ Slow execution - consider optimizing');
  }

  if (metrics.estimatedTimeSaved > 60) {
    insights.push(`✨ This automation has saved you ${Math.round(metrics.estimatedTimeSaved)} minutes!`);
  }

  return insights.length > 0
    ? insights
    : ['Continue monitoring this automation for performance trends'];
}
