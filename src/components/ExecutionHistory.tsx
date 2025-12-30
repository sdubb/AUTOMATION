import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { backendService } from '../lib/backendService';
import { SkeletonLoader } from './SkeletonLoader';

interface ExecutionLog {
  id: string;
  status: 'success' | 'failed' | 'running';
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  trigger_data: Record<string, unknown>;
  execution_data: Record<string, unknown>;
}

// Helper function to format error messages in plain English
function formatErrorMessage(error: string): { title: string; description: string; suggestion: string } {
  const errorLower = error.toLowerCase();
  
  // Connection/Auth errors
  if (errorLower.includes('auth') || errorLower.includes('unauthorized') || errorLower.includes('invalid token')) {
    return {
      title: 'Connection Expired',
      description: 'Your authentication token has expired',
      suggestion: 'Reconnect the service and test again'
    };
  }
  
  if (errorLower.includes('permission') || errorLower.includes('forbidden')) {
    return {
      title: 'Permission Denied',
      description: 'The app does not have permission to perform this action',
      suggestion: 'Check that you granted all necessary permissions when connecting'
    };
  }
  
  // Rate limiting errors
  if (errorLower.includes('rate limit') || errorLower.includes('too many requests')) {
    return {
      title: 'Rate Limited',
      description: 'Too many requests were made to the service',
      suggestion: 'Wait a few minutes and try again'
    };
  }
  
  // Connection errors
  if (errorLower.includes('timeout') || errorLower.includes('connection')) {
    return {
      title: 'Connection Failed',
      description: 'Could not connect to the service',
      suggestion: 'Check your internet connection and try again'
    };
  }
  
  // Data validation errors
  if (errorLower.includes('invalid') || errorLower.includes('schema')) {
    return {
      title: 'Invalid Data',
      description: 'The data format was not valid for this service',
      suggestion: 'Review your automation configuration and test again'
    };
  }
  
  // Default error
  return {
    title: 'Error',
    description: error,
    suggestion: 'Check your connections and automation configuration'
  };
}

interface ExecutionHistoryProps {
  automationId: string;
  onClose: () => void;
}

export function ExecutionHistory({ automationId, onClose }: ExecutionHistoryProps) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    loadExecutionHistory();
  }, [automationId]);

  const loadExecutionHistory = async () => {
    setLoading(true);
    try {
      const logs = await backendService.executionLogs.list(automationId);
      setLogs(logs || []);
    } catch (err) {
      console.error('Failed to load execution history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (started: string, completed: string | null) => {
    if (!completed) return 'Running...';
    const start = new Date(started);
    const end = new Date(completed);
    const diffMs = end.getTime() - start.getTime();
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Execution History</h3>
            <p className="text-sm text-slate-600 mt-1">View all automation runs and their results</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-2 hover:bg-slate-100 rounded-lg"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No executions yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Execution history will appear here once the automation runs
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const isSuccess = log.status === 'success';
              const isFailed = log.status === 'failed';
              const isExpanded = expandedLog === log.id;

              return (
                <div
                  key={log.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isFailed
                      ? 'border-red-200 bg-red-50/30'
                      : isSuccess
                      ? 'border-green-200 bg-green-50/30'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        isSuccess ? 'bg-green-100' : isFailed ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {isSuccess ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : isFailed ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${
                            isSuccess ? 'text-green-700' : isFailed ? 'text-red-700' : 'text-blue-700'
                          }`}>
                            {isSuccess ? 'Success' : isFailed ? 'Failed' : 'Running'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDate(log.started_at)}
                          </span>
                        </div>
                        {isFailed && log.error_message && (
                          <p className="text-sm text-red-700 mt-1 font-medium">
                            {log.error_message}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span>Duration: {formatDuration(log.started_at, log.completed_at)}</span>
                          {log.completed_at && (
                            <span>Completed: {new Date(log.completed_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      className="p-2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                      {log.error_message && (
                        <div>
                          <span className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
                            Error Details
                          </span>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                            {(() => {
                              const formatted = formatErrorMessage(log.error_message);
                              return (
                                <>
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-red-800">{formatted.title}</p>
                                      <p className="text-sm text-red-700 mt-1">{formatted.description}</p>
                                      <p className="text-xs text-red-700 bg-red-100 rounded px-2 py-1 inline-block mt-2">
                                        💡 {formatted.suggestion}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="bg-red-100 rounded p-2 text-xs text-red-800 font-mono overflow-x-auto">
                                    {log.error_message}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                      {Object.keys(log.trigger_data).length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
                            Trigger Data
                          </span>
                          <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs overflow-x-auto">
                            {JSON.stringify(log.trigger_data, null, 2)}
                          </pre>
                        </div>
                      )}
                      {Object.keys(log.execution_data).length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
                            Execution Data
                          </span>
                          <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs overflow-x-auto">
                            {JSON.stringify(log.execution_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

