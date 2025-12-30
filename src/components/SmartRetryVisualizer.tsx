import { useState } from 'react';
import { ExecutionWithRetries, getRetrySummary, getRetryRecommendation } from '../lib/smartRetryLogic';

interface SmartRetryVisualizerProps {
  execution: ExecutionWithRetries;
  isRunning?: boolean;
}

export function SmartRetryVisualizer({ execution, isRunning = false }: SmartRetryVisualizerProps) {
  const summary = getRetrySummary(execution);
  const recommendation = getRetryRecommendation(execution);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-3">
      {/* Attempt Timeline */}
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="font-semibold text-sm mb-3">Execution Timeline</h3>

        <div className="space-y-2">
          {execution.attempts.map((attempt) => (
            <div key={attempt.attempt} className="flex items-start gap-3">
              {/* Attempt Number */}
              <div className="min-w-fit">
                <span className="inline-block px-2 py-0.5 bg-gray-200 rounded text-xs font-mono">
                  Attempt {attempt.attempt}
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {attempt.status === 'success' && (
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                  {attempt.status === 'failed' && (
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                  {attempt.status === 'running' && (
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  )}
                  {attempt.status === 'pending' && (
                    <span className="inline-block w-2 h-2 bg-gray-300 rounded-full"></span>
                  )}

                  <span className="text-sm font-medium capitalize text-gray-700">{attempt.status}</span>
                  <span className="text-xs text-gray-500">{attempt.duration}ms</span>
                </div>

                {attempt.error && (
                  <p className="text-xs text-red-600 mt-1 break-words">{attempt.error}</p>
                )}
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-500 whitespace-nowrap">
                {new Date(attempt.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}

          {isRunning && (
            <div className="flex items-center gap-2 text-sm text-blue-600 animate-pulse">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
              Retrying...
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">Total Time</div>
          <div className="font-semibold text-lg">{(summary.totalTime / 1000).toFixed(2)}s</div>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">Attempts</div>
          <div className="font-semibold text-lg">{summary.totalAttempts}</div>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">Avg/Attempt</div>
          <div className="font-semibold text-lg">{summary.avgTimePerAttempt}ms</div>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">Failures</div>
          <div className={`font-semibold text-lg ${summary.failures > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {summary.failures}
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div
        className={`p-3 rounded-lg border ${
          execution.finalStatus === 'success'
            ? 'bg-green-50 border-green-200'
            : execution.finalStatus === 'failed'
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
        }`}
      >
        <p className="text-sm font-medium text-gray-700">{recommendation}</p>
      </div>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-2">
          <div>
            <span className="font-medium text-gray-700">Success on Attempt:</span>
            <span className="ml-2 text-gray-600">
              {summary.successAttempt ? `#${summary.successAttempt}` : 'Failed'}
            </span>
          </div>
          {summary.successAttempt && (
            <div>
              <span className="font-medium text-gray-700">Flakiness Level:</span>
              <span className="ml-2">
                {summary.successAttempt <= 1 && '✅ None (first try)'}
                {summary.successAttempt === 2 && '⚠️ Low (second try)'}
                {summary.successAttempt === 3 && '⚠️ Medium (third try)'}
                {summary.successAttempt > 3 && '❌ High (multiple retries)'}
              </span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
      >
        {showDetails ? '▼ Hide Details' : '▶ Show Details'}
      </button>
    </div>
  );
}
