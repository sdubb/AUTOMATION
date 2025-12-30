import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Loader2, AlertCircle, RotateCcw, Copy, Eye, EyeOff } from 'lucide-react';
import { backendService } from '../lib/backendService';

interface WebhookLog {
  id: string;
  webhook_config_id: string | null;
  webhook_type: string;
  direction: string;
  url: string;
  method: string;
  request_body: Record<string, unknown>;
  response_status: number | null;
  processing_status: string;
  error_message: string | null;
  retry_count: number;
  processing_duration_ms: number;
  created_at: string;
  signature_verified?: boolean;
}

interface WebhookHistoryProps {
  automationId?: string;
  automationName?: string;
}

export function WebhookHistory(_: WebhookHistoryProps) {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPayload, setShowPayload] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    loadWebhookHistory();
    const interval = setInterval(loadWebhookHistory, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [statusFilter]);

  const loadWebhookHistory = async () => {
    try {
      const logs = await backendService.webhooks.testDelivery(statusFilter);
      setLogs(logs || []);
    } catch (err) {
      console.error('Failed to load webhook history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryWebhook = async (log: WebhookLog) => {
    if (!log.webhook_config_id) {
      alert('Cannot retry inbound webhooks');
      return;
    }

    setRetrying(log.id);
    try {
      await backendService.webhooks.testDelivery(log.webhook_config_id);
      alert('✅ Webhook retry queued');
      await loadWebhookHistory();
    } catch (err) {
      console.error('Retry failed:', err);
      alert('Error retrying webhook');
    } finally {
      setRetrying(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'retrying':
        return 'bg-yellow-50 border-yellow-200';
      case 'timeout':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">✅ Success</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">❌ Failed</span>;
      case 'retrying':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">⏳ Retrying</span>;
      case 'timeout':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">⏱️ Timeout</span>;
      case 'queued':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">📋 Queued</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">{status}</span>;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Webhook History</h3>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">All Status</option>
          <option value="success">Success Only</option>
          <option value="failed">Failed Only</option>
          <option value="retrying">Retrying</option>
          <option value="timeout">Timeout</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
            <p>No webhook history yet</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`border rounded-lg p-4 transition cursor-pointer hover:shadow-sm ${getStatusColor(log.processing_status)}`}
            >
              <div onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(log.processing_status)}
                      <code className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
                        {log.method}
                      </code>
                      <span className="text-xs text-gray-600">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 truncate mb-1">
                      <strong>URL:</strong> {log.url}
                    </p>
                    {log.response_status && (
                      <p className="text-sm text-gray-600">
                        <strong>Response:</strong> {log.response_status} • 
                        <strong className="ml-2">Duration:</strong> {log.processing_duration_ms}ms
                      </p>
                    )}
                    {log.signature_verified !== null && (
                      <p className="text-xs text-gray-600 mt-1">
                        <strong>Signature:</strong> {log.signature_verified ? '✅ Verified' : '❌ Invalid'}
                      </p>
                    )}
                  </div>
                  <button
                    className="p-2 hover:bg-gray-200 rounded transition"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    {expandedId === log.id ? (
                      <ChevronUp size={18} className="text-gray-600" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {expandedId === log.id && (
                <div className="mt-4 pt-4 border-t border-gray-300 space-y-4">
                  {/* Error Message */}
                  {log.error_message && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm font-medium text-red-800 mb-1">Error:</p>
                      <code className="text-xs text-red-700 block overflow-auto">
                        {log.error_message}
                      </code>
                    </div>
                  )}

                  {/* Request Payload */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => setShowPayload({ ...showPayload, [log.id]: !showPayload[log.id] })}
                        className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1"
                      >
                        {showPayload[log.id] ? <Eye size={16} /> : <EyeOff size={16} />}
                        Request Payload
                      </button>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(log.request_body, null, 2))}
                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                        title="Copy to clipboard"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    {showPayload[log.id] && (
                      <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-auto max-h-200">
                        {JSON.stringify(log.request_body, null, 2)}
                      </pre>
                    )}
                  </div>

                  {/* Retry Information */}
                  <div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Retry Attempts:</strong> {log.retry_count}
                    </p>
                    {log.processing_status === 'failed' && log.webhook_config_id && (
                      <button
                        onClick={() => handleRetryWebhook(log)}
                        disabled={retrying === log.id}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {retrying === log.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <RotateCcw size={16} />
                        )}
                        Retry Webhook
                      </button>
                    )}
                  </div>

                  {/* Debug Info */}
                  <div className="bg-gray-100 p-3 rounded text-xs">
                    <p className="text-gray-600 mb-1">
                      <strong>ID:</strong> <code className="text-gray-700">{log.id}</code>
                    </p>
                    <p className="text-gray-600">
                      <strong>Type:</strong> {log.webhook_type} ({log.direction})
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
