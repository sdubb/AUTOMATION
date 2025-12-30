import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { backendService } from '../lib/backendService';
import { generateExecutionSummary, type ExecutionSummary } from '../lib/summaryService';
import { EmptyState } from './EmptyState';

interface SummariesProps {
  automationId: string;
}

export function Summaries({ automationId }: SummariesProps) {
  const [summaries, setSummaries] = useState<ExecutionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rawLogsExpanded, setRawLogsExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadSummaries();
  }, [automationId]);

  const loadSummaries = async () => {
    setLoading(true);
    try {
      const executions = await backendService.automations.getExecutions(automationId);
      
      const summariesList: ExecutionSummary[] = [];
      for (const exec of executions?.slice(0, 10) || []) {
        // Fetch logs for each execution
        const logs = await backendService.executionLogs.list({ executionId: exec.id });
        
        // Generate summary from logs
        const summary = await generateExecutionSummary(
          exec.name || 'Automation',
          exec.id,
          logs || []
        );
        summariesList.push(summary);
      }

      setSummaries(summariesList);
    } catch (error) {
      console.error('Failed to load summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'failure':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-amber-50 border-amber-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'failure':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-amber-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Execution Summaries</h3>
          <button
            disabled
            className="px-3 py-1 text-sm bg-gray-300 text-gray-600 rounded cursor-not-allowed"
          >
            Refresh
          </button>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Execution Summaries</h3>
          <button
            onClick={loadSummaries}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
        <EmptyState
          icon="TrendingUp"
          title="No Execution Summaries"
          description="Run your automation to generate and view execution summaries with detailed analytics and insights."
          action={{
            label: 'Refresh',
            onClick: loadSummaries,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Execution Summaries</h3>
        <button
          onClick={loadSummaries}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {summaries.map((summary) => (
          <div
            key={summary.executionId}
            className={`border rounded-lg ${getStatusColor(summary.status)}`}
          >
            {/* Summary Header */}
            <button
              onClick={() =>
                setExpandedId(
                  expandedId === summary.executionId ? null : summary.executionId
                )
              }
              className="w-full p-4 flex items-start gap-3 hover:bg-opacity-75 transition"
            >
              {getStatusIcon(summary.status)}
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{summary.automationId}</h4>
                  <ChevronDown
                    className={`w-4 h-4 transition ${
                      expandedId === summary.executionId ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                <p className="text-sm text-gray-700 mt-1">{summary.summary}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-600">
                  <span>⏱️ {summary.keyMetrics.duration}</span>
                  <span>✅ {summary.keyMetrics.actionsExecuted} actions</span>
                  <span>❌ {summary.keyMetrics.errorCount} errors</span>
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedId === summary.executionId && (
              <div className="px-4 pb-4 pt-2 border-t border-current border-opacity-20 space-y-3">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-white rounded">
                    <p className="text-gray-600">Triggers Matched</p>
                    <p className="font-semibold">{summary.keyMetrics.triggersMatched}</p>
                  </div>
                  <div className="p-2 bg-white rounded">
                    <p className="text-gray-600">Actions Executed</p>
                    <p className="font-semibold">{summary.keyMetrics.actionsExecuted}</p>
                  </div>
                </div>

                {/* Highlighted Failures */}
                {summary.highlightedFailures.length > 0 && (
                  <div className="p-3 bg-red-100 rounded border border-red-300">
                    <p className="text-sm font-semibold text-red-900 mb-1">⚠️ Issues Found:</p>
                    <ul className="text-sm text-red-800 space-y-1">
                      {summary.highlightedFailures.map((failure, idx) => (
                        <li key={idx}>• {failure}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Steps */}
                {summary.nextSteps.length > 0 && (
                  <div className="p-3 bg-blue-100 rounded border border-blue-300">
                    <p className="text-sm font-semibold text-blue-900 mb-1">📋 Next Steps:</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {summary.nextSteps.map((step, idx) => (
                        <li key={idx}>• {step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Raw Logs Toggle */}
                <button
                  onClick={() =>
                    setRawLogsExpanded(
                      rawLogsExpanded === summary.executionId ? null : summary.executionId
                    )
                  }
                  className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <ChevronDown
                    className={`w-3 h-3 transition ${
                      rawLogsExpanded === summary.executionId ? 'rotate-180' : ''
                    }`}
                  />
                  {rawLogsExpanded === summary.executionId ? 'Hide' : 'Show'} Raw Logs
                </button>

                {rawLogsExpanded === summary.executionId && (
                  <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
                    <p className="text-gray-400 mb-2">Execution ID: {summary.executionId}</p>
                    <pre>
                      {JSON.stringify(summary, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
