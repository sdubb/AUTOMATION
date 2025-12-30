import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { calculateExecutionMetrics, formatMetrics, getInsights, ExecutionMetrics } from '../lib/executionAnalytics';
import { EmptyState } from './EmptyState';

interface ExecutionAnalyticsProps {
  automationId: string;
  automationName: string;
  executionLogs: any[];
}

export function ExecutionAnalytics({ automationId, automationName, executionLogs }: ExecutionAnalyticsProps) {
  const [metrics, setMetrics] = useState<ExecutionMetrics | null>(null);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    if (executionLogs.length === 0) return;

    const calculated = calculateExecutionMetrics(automationId, automationName, executionLogs);
    setMetrics(calculated);
    setInsights(getInsights(calculated));
  }, [automationId, automationName, executionLogs]);

  if (!metrics || executionLogs.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-8 h-8 text-gray-400" />}
        title="No execution data yet"
        description="Run this automation to see performance analytics and insights"
      />
    );
  }

  const formatted = formatMetrics(metrics);

  return (
    <div className="space-y-4">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-600">Success Rate</div>
          </div>
          <div className="text-2xl font-bold text-green-600">{formatted.successRate}</div>
          <div className="text-xs text-gray-500 mt-1">
            {metrics.successCount} of {metrics.totalExecutions} runs
          </div>
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-600">Avg Time</div>
          </div>
          <div className="text-2xl font-bold text-blue-600">{formatted.avgTime}</div>
          <div className="text-xs text-gray-500 mt-1">Per execution</div>
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-600">Time Saved</div>
          </div>
          <div className="text-2xl font-bold text-purple-600">{formatted.timeSaved}</div>
          <div className="text-xs text-gray-500 mt-1">Total this month</div>
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-600">Estimated Cost</div>
          </div>
          <div className="text-2xl font-bold text-orange-600">{formatted.cost}</div>
          <div className="text-xs text-gray-500 mt-1">Monthly estimate</div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="font-semibold text-sm mb-3">Execution Details</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Total Executions:</span>
            <span className="ml-2 font-semibold">{metrics.totalExecutions}</span>
          </div>
          <div>
            <span className="text-gray-600">This Month:</span>
            <span className="ml-2 font-semibold">{metrics.thisMonthExecutions}</span>
          </div>
          <div>
            <span className="text-gray-600">Successes:</span>
            <span className="ml-2 font-semibold text-green-600">{metrics.successCount}</span>
          </div>
          <div>
            <span className="text-gray-600">Failures:</span>
            <span className="ml-2 font-semibold text-red-600">{metrics.failureCount}</span>
          </div>
          <div>
            <span className="text-gray-600">Skipped:</span>
            <span className="ml-2 font-semibold text-yellow-600">{metrics.skippedCount}</span>
          </div>
          <div>
            <span className="text-gray-600">Trend:</span>
            <span className="ml-2 font-semibold text-lg">{formatted.trend}</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-sm text-blue-900 mb-2">💡 Insights</h3>
          <ul className="space-y-1">
            {insights.map((insight, idx) => (
              <li key={idx} className="text-sm text-blue-800">
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Last Execution */}
      {metrics.lastExecutionAt && (
        <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
          Last executed: {new Date(metrics.lastExecutionAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
